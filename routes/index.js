var express = require("express");
var router = express.Router();

const AWS = require("aws-sdk");
const { response } = require("express");
const IVSChat = new AWS.Ivschat();

/* GET home page. */
router.post("/auth", async function (req, res, next) {
  const body = req.body;
  const { arn, roomIdentifier, userId } = body;
  const roomId = arn || roomIdentifier;
  const additionalAttributes = body.attributes || {};
  const capabilities = body.capabilities || []; // The permission to view messages is implicit
  const durationInMinutes = body.durationInMinutes || 55; // default the expiration to 55 mintues
  if (!roomId || !userId) {
    response.statusCode = 400;
    response.body = {
      error: "Missing parameters: `arn or roomIdentifier`, `userId`",
    };
    return res.status(response.statusCode).json(response.body);
  }

  // Construct parameters.
  // Documentation is available at https://docs.aws.amazon.com/ivs/latest/ChatAPIReference/Welcome.html
  const params = {
    roomIdentifier: `${roomId}`,
    userId: `${userId}`,
    attributes: { ...additionalAttributes },
    capabilities: capabilities,
    sessionDurationInMinutes: durationInMinutes,
  };

  try {
    const data = await IVSChat.createChatToken(params).promise();
    console.info("Got data:", data);
    response.statusCode = 200;
    response.body = data;
  } catch (err) {
    console.error("ERROR: chatAuthHandler > IVSChat.createChatToken:", err);
    response.statusCode = 500;
    response.body = err.stack;
  }
  console.info(
    `response from: ${req.path} statusCode: ${response.statusCode} body: ${response.body}`
  );
  return res.status(response.statusCode).json(response.body);
});

module.exports = router;
