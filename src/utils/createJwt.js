import jwt from "jsonwebtoken";
export const jwtGeneratorToSendRequestToCMT = (orgId, userId) => {
  return jwt.sign(
    {
      userId: userId,
      orgId: orgId,
    },
    process.env.JWT_PRIVATE_KEY_FOR_CMT,
    { expiresIn: "10m" }
  );
};
