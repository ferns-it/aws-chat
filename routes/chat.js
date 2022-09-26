var express = require("express");
var router = express.Router();

const AWS = require("aws-sdk");
const IVSChat = new AWS.Ivschat({ region: "ap-south-1" });

const response = {
  statusCode: 200,
  headers: {
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST",
  },
  body: "",
};

/* TO CREATE CHAT TOKEN */
router.post("/auth", async function (req, res) {
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
    response.body = err.message;
  }
  console.info(
    `response from: ${req.path} statusCode: ${response.statusCode} body: ${response.body}`
  );
  return res.status(response.statusCode).json(response.body);
});

/* TO HANDLE CHAT EVENT */
router.post("/event", async (req, res) => {
  const body = req.body;
  const { arn, eventAttributes, eventName } = body;
  // Construct parameters.
  // Documentation is available at https://docs.aws.amazon.com/ivs/latest/ChatAPIReference/Welcome.html
  const params = {
    roomIdentifier: `${arn}`,
    eventName: eventName,
    attributes: { ...eventAttributes },
  };

  try {
    await IVSChat.sendEvent(params).promise();
    console.info("chatEventHandler > IVSChat.sendEvent > Success");
    response.statusCode = 200;
    // If sendEvent() is successfull, it will return an empty response.
    // For the purposes of this API however, let's return "success" in the response body
    response.body = {
      arn: `${arn}`,
      status: "success",
    };
  } catch (err) {
    console.error("ERROR: chatEventHandler > IVSChat.sendEvent:", err);
    response.statusCode = 500;
    response.body = err.message;
  }

  console.info(
    `response from: ${req.path} statusCode: ${response.statusCode} body: ${response.body}`
  );
  return res.status(response.statusCode).json(response.body);
});

module.exports = router;
