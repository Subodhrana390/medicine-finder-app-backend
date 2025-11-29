import axios from "axios";

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://auth-service:3001";

/**
 * Get user data from auth service
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - User data
 */
export const getUserFromAuthService = async (userId) => {
  try {
    const response = await axios.get(`${AUTH_SERVICE_URL}/api/auth/user/${userId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.INTERNAL_API_KEY || 'internal-key'}`
      }
    });
    return response.data.user;
  } catch (error) {
    console.error("Error fetching user from auth service:", error.message);
    throw new Error("Failed to fetch user data");
  }
};

/**
 * Update user data in auth service
 * @param {string} userId - User ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} - Updated user data
 */
export const updateUserInAuthService = async (userId, updateData) => {
  try {
    const response = await axios.put(`${AUTH_SERVICE_URL}/api/auth/user/${userId}`, updateData, {
      headers: {
        'Authorization': `Bearer ${process.env.INTERNAL_API_KEY || 'internal-key'}`
      }
    });
    return response.data.user;
  } catch (error) {
    console.error("Error updating user in auth service:", error.message);
    throw new Error("Failed to update user data");
  }
};

/**
 * Delete user from auth service
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} - Success status
 */
export const deleteUserFromAuthService = async (userId) => {
  try {
    await axios.delete(`${AUTH_SERVICE_URL}/api/auth/user/${userId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.INTERNAL_API_KEY || 'internal-key'}`
      }
    });
    return true;
  } catch (error) {
    console.error("Error deleting user from auth service:", error.message);
    throw new Error("Failed to delete user");
  }
};
