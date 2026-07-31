import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";

admin.initializeApp();

// Configure the email transporter using environment variables or fallback values.
// In production, these should be set via Secret Manager or Cloud Functions configuration.
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL_USER || "", // Sender email
    pass: process.env.EMAIL_PASS || "", // App password or SMTP key
  },
});

export const checkPriceDropAndAlert = onDocumentUpdated("products/{productId}", async (event) => {
  const newValue = event.data?.after.data();
  const oldValue = event.data?.before.data();

  if (!newValue) return null;

  const currentPrice = newValue.priceAmazon;
  const previousPrice = oldValue?.priceAmazon || 0;

  // We only run if the price has dropped or was set for the first time
  if (currentPrice >= previousPrice && previousPrice !== 0) {
    console.log(`Price did not decrease for product ${newValue.name}. (Previous: ${previousPrice}, Current: ${currentPrice})`);
    return null;
  }

  console.log(`Product ${newValue.name} price changed to ₹${currentPrice}. Checking active alerts...`);

  const db = admin.firestore();
  
  // Query active alerts for this product
  const alertsSnapshot = await db.collection("price_alerts")
    .where("productId", "==", event.params.productId)
    .where("status", "==", "active")
    .get();

  if (alertsSnapshot.empty) {
    console.log("No active alerts found for this product.");
    return null;
  }

  const emailPromises = [];

  for (const doc of alertsSnapshot.docs) {
    const alert = doc.data();
    const targetPrice = alert.targetPrice;
    const userEmail = alert.email;

    // Trigger alert if current price is at or below the target price
    if (currentPrice <= targetPrice) {
      console.log(`Triggering price alert for ${userEmail}. Target: ₹${targetPrice}, Actual: ₹${currentPrice}`);

      // Compose the notification email
      const mailOptions = {
        from: `"CodeCraft Price Alert" <${process.env.EMAIL_USER || "noreply@codecrafttechno.com"}>`,
        to: userEmail,
        subject: `🚨 Price Drop Alert: ${newValue.name} is now ₹${currentPrice}!`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 10px;">
            <h2 style="color: #f97316; text-align: center;">🚨 PRICE DROP ALERT! 🚨</h2>
            <p>Hello,</p>
            <p>Great news! The product you are tracking has dropped to or below your target price.</p>
            
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f97316;">
              <h3 style="margin-top: 0; color: #1e293b;">${newValue.name}</h3>
              <p style="margin: 5px 0;"><strong>Your Target Price:</strong> ₹${targetPrice.toLocaleString('en-IN')}</p>
              <p style="margin: 5px 0; font-size: 18px; color: #16a34a;"><strong>Current Amazon Price:</strong> ₹${currentPrice.toLocaleString('en-IN')}</p>
              <p style="margin: 5px 0; color: #d97706;"><strong>You Save:</strong> ₹${(newValue.originalPrice - currentPrice).toLocaleString('en-IN')} off MRP!</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${newValue.buyUrlAmazon || 'https://amazon.in'}" style="background-color: #f97316; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Buy on Amazon India Now
              </a>
            </div>
            
            <hr style="border: 0; border-top: 1px solid #eee;" />
            <p style="font-size: 11px; color: #64748b; text-align: center;">
              This is an automated notification from CodeCraft Techno. You configured a price tracker for this product.
              To unsubscribe or delete this tracker, visit the Price Trackers modal on our website.
            </p>
          </div>
        `,
      };

      const sendPromise = transporter.sendMail(mailOptions)
        .then(async (info) => {
          console.log(`Email sent successfully to ${userEmail}: ${info.messageId}`);
          
          // Mark alert as triggered
          await doc.ref.update({
            status: "triggered",
            triggeredAt: admin.firestore.FieldValue.serverTimestamp(),
            lastTriggeredPrice: currentPrice,
          });
        })
        .catch((error) => {
          console.error(`Failed to send email to ${userEmail}:`, error);
        });

      emailPromises.push(sendPromise);
    }
  }

  await Promise.all(emailPromises);
  return null;
});
