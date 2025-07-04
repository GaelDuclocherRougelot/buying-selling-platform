import { Pool } from "pg";

const pool = new Pool({
    connectionString: process.env.CONNECTION_STRING, // ou ta variable d'env spécifique
});


/**
 * Deletes a user account and related data from the database.
 *
 * This function performs the following actions:
 * 1. Deletes all records from the "account" table associated with the given user ID.
 * 2. Deletes all records from the "session" table associated with the given user ID.
 * 3. Performs a soft delete on the user by setting the "deletedAt" field to the current timestamp
 *    in the "user" table. The user's data remains in the database for 12 months before being permanently deleted.
 *
 * @param userId - The unique identifier of the user to delete.
 * @returns The updated user record after the soft delete operation.
 * @throws Will throw an error if the user is not found or has already been deleted.
 */
export async function deleteUserAccount(userId: string) {
    console.log("userId", userId);
    // Delete user-related data from the database (account for connection)
	await pool.query(
		`DELETE FROM "account" WHERE "userId" = $1`,
		[userId]
    );
    // Delete user-related data from the database (session)
    await pool.query(`DELETE FROM "session" WHERE "userId" = $1`, [userId]);

    // Soft delete the user by setting the deletedAt field to the current timestamp
    // The data will still be present in the database for 12 months and deleted after that period
    const query = `UPDATE "user" SET "deletedAt" = now() WHERE id = $1 RETURNING *`;
    
    const result = await pool.query(query, [userId]);

	if (result.rows.length === 0) {
		throw new Error('User not found or already deleted');
	}
	return result.rows[0];
}

export async function getUserByUsername(username: string) {
    const query = `SELECT * FROM "user" WHERE "username" = $1`;
    const result = await pool.query(query, [username]);
    console.log(result.rows[0]);
    return result.rows[0];
}