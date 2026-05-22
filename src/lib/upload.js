/**
 * Cloudinary Upload Utility for CHAT FRIEND
 * Performs a signed upload from the client using Web Crypto API for SHA-1 hashing.
 */

// Cloudinary configuration constants
// IMPORTANT: Please change CLOUDINARY_CLOUD_NAME to your actual Cloudinary Cloud Name!
// You can find your Cloud Name on your Cloudinary Dashboard.
const CLOUDINARY_CLOUD_NAME = "dfm0eiw5b"; 
const CLOUDINARY_API_KEY = "222574365961116";
const CLOUDINARY_API_SECRET = "BBxJascqLIwx-JtJfKZitOdxw2Y";

/**
 * Generates a SHA-1 hash of a string using the browser's native SubtleCrypto API.
 * @param {string} string - The string to hash.
 * @returns {Promise<string>} Hex representation of the SHA-1 hash.
 */
async function sha1(string) {
  const utf8 = new TextEncoder().encode(string);
  const hashBuffer = await crypto.subtle.digest("SHA-1", utf8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}

/**
 * Uploads a file to Cloudinary using a signed upload.
 * @param {File} file - The image file to upload.
 * @returns {Promise<string>} The secure URL of the uploaded image.
 */
const uploadToCloudinary = async (file) => {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    
    // Sort parameters alphabetically to sign them
    // For a basic upload, we only need to sign the timestamp parameter
    const stringToSign = `timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
    
    // Generate signature
    const signature = await sha1(stringToSign);
    
    // Create form data for the request
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", CLOUDINARY_API_KEY);
    formData.append("timestamp", timestamp.toString());
    formData.append("signature", signature);
    
    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
    
    const response = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error("Cloudinary upload failed:", data);
      throw new Error(data.error?.message || "Cloudinary upload failed");
    }
    
    return data.secure_url;
  } catch (error) {
    console.error("Error in uploadToCloudinary:", error);
    throw error;
  }
};

export default uploadToCloudinary;
