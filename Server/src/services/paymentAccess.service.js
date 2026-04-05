import Purchase from "../models/purchase.model.js";

/**
 * Free tests (price <= 0) are always accessible.
 * Paid tests require a completed purchase for this user.
 */
export async function userHasPaidAccess(userId, mockTest) {
    if (!mockTest) return false;
    const price = Number(mockTest.price);
    if (!Number.isFinite(price) || price <= 0) return true;

    const purchase = await Purchase.findOne({
        userId,
        mockTestId: mockTest._id,
        status: "completed",
    }).lean();

    return !!purchase;
}
