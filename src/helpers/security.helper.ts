import bcrypt from 'bcrypt';

/**
 * Encrypts a password using bcrypt.
 *
 * @param {string} password - The plaintext value supplied by the caller
 */
export async function encryptPassword(password: string): Promise<string> {
	return await bcrypt.hash(password, 10);
}

/**
 * Constant-time comparison of a plaintext secret against a bcrypt hash.
 *
 * @param {string} password - The plaintext value supplied by the caller
 * @param {string} hashedPassword - The stored bcrypt hash
 * @returns {Promise<boolean>} - True when the two match
 */
export async function comparePassword(
	password: string,
	hashedPassword: string,
): Promise<boolean> {
	return await bcrypt.compare(password, hashedPassword);
}
