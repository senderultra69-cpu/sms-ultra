var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server.ts
var server_exports = {};
__export(server_exports, {
  default: () => server_default
});
module.exports = __toCommonJS(server_exports);
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_vite = require("vite");
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = Number(process.env.PORT) || 3e3;
app.use(import_express.default.json());
app.use(import_express.default.urlencoded({ extended: true }));
app.post("/api/send-sms", async (req, res) => {
  const { gatewayType, settings, contacts, baseMessage, simulatedSuccessMode } = req.body;
  if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
    res.status(400).json({ success: false, error: "No contact data provided" });
    return;
  }
  const results = [];
  for (const contact of contacts) {
    const { phone, name, content } = contact;
    const finalContent = content || baseMessage || "";
    const cleanPhone = phone.replace(/\s+/g, "");
    if (!cleanPhone) {
      results.push({
        phone: "Unknown",
        name,
        status: "failed",
        error: "Empty phone number",
        responseSummary: "Invalid entry"
      });
      continue;
    }
    if (simulatedSuccessMode) {
      await new Promise((resolve) => setTimeout(resolve, 120 + Math.random() * 150));
      results.push({
        phone: cleanPhone,
        name,
        status: "delivered",
        responseSummary: JSON.stringify({
          messageId: `msg_easysend_live_${Math.random().toString(36).substring(3, 11)}`,
          code: 0,
          desc: "Accepted by operator (carrier simulated direct bypass)"
        })
      });
      continue;
    }
    if (gatewayType === "mock") {
      await new Promise((resolve) => setTimeout(resolve, 80 + Math.random() * 120));
      const isSuccess = Math.random() < 0.96;
      results.push({
        phone: cleanPhone,
        name,
        status: isSuccess ? "delivered" : "failed",
        error: isSuccess ? void 0 : "Simulated provider signal delivery timeout (Code: 154)",
        responseSummary: isSuccess ? JSON.stringify({ messageId: `msg_mock_${Math.random().toString(36).substring(3, 11)}`, code: 0, desc: "Success" }) : JSON.stringify({ code: 504, desc: "Signal lost" })
      });
      continue;
    }
    if (gatewayType === "twilio") {
      const { twilioSid, twilioToken, twilioFrom } = settings || {};
      if (!twilioSid || !twilioToken || !twilioFrom) {
        results.push({
          phone: cleanPhone,
          name,
          status: "failed",
          error: "Missing Twilio parameters in configuration settings.",
          responseSummary: "Configuration Error"
        });
        continue;
      }
      try {
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
        const authHeader = "Basic " + Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64");
        const formData = new URLSearchParams();
        formData.append("To", cleanPhone);
        formData.append("From", twilioFrom);
        formData.append("Body", finalContent);
        const response = await fetch(twilioUrl, {
          method: "POST",
          headers: {
            "Authorization": authHeader,
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: formData.toString()
        });
        const data = await response.json();
        if (response.ok) {
          results.push({
            phone: cleanPhone,
            name,
            status: "sent",
            responseSummary: `SID: ${data.sid || "sent"} | Status: ${data.status}`
          });
        } else {
          results.push({
            phone: cleanPhone,
            name,
            status: "failed",
            error: data.message || `Twilio error status ${response.status}`,
            responseSummary: JSON.stringify(data)
          });
        }
      } catch (err) {
        results.push({
          phone: cleanPhone,
          name,
          status: "failed",
          error: err.message || "Twilio network fetch breakdown.",
          responseSummary: String(err)
        });
      }
      continue;
    }
    if (gatewayType === "custom") {
      const {
        url,
        method = "POST",
        contentType = "application/json",
        headers = [],
        queryIdField,
        queryIdVal,
        querySecField,
        querySecVal,
        phoneField = "mobile",
        textField = "message",
        additionalParams = []
      } = settings || {};
      if (!url) {
        results.push({
          phone: cleanPhone,
          name,
          status: "failed",
          error: "API Endpoint URL is missing in the Gateway configuration.",
          responseSummary: "Invalid Gateway Endpoint"
        });
        continue;
      }
      try {
        const paramsMap = /* @__PURE__ */ new Map();
        if (queryIdField && queryIdVal) {
          paramsMap.set(queryIdField, queryIdVal);
        }
        if (querySecField && querySecVal) {
          paramsMap.set(querySecField, querySecVal);
        }
        if (phoneField) {
          paramsMap.set(phoneField, cleanPhone);
        }
        if (textField) {
          paramsMap.set(textField, finalContent);
        }
        if (Array.isArray(additionalParams)) {
          for (const item of additionalParams) {
            if (item.key) {
              paramsMap.set(item.key, item.value || "");
            }
          }
        }
        const fetchHeaders = {};
        if (Array.isArray(headers)) {
          for (const item of headers) {
            if (item.key) {
              fetchHeaders[item.key] = item.value || "";
            }
          }
        }
        let targetUrl = url;
        let fetchBody = void 0;
        if (method === "GET") {
          const queryParams = new URLSearchParams();
          paramsMap.forEach((val, key) => queryParams.append(key, val));
          const connector = targetUrl.includes("?") ? "&" : "?";
          targetUrl = `${targetUrl}${connector}${queryParams.toString()}`;
        } else {
          if (contentType === "application/json") {
            fetchHeaders["Content-Type"] = "application/json";
            const bodyObj = {};
            paramsMap.forEach((val, key) => {
              bodyObj[key] = val;
            });
            fetchBody = JSON.stringify(bodyObj);
          } else {
            fetchHeaders["Content-Type"] = "application/x-www-form-urlencoded";
            const bodyForm = new URLSearchParams();
            paramsMap.forEach((val, key) => bodyForm.append(key, val));
            fetchBody = bodyForm;
          }
        }
        const fetchResponse = await fetch(targetUrl, {
          method,
          headers: fetchHeaders,
          body: method === "POST" ? fetchBody : void 0
        });
        const responseText = await fetchResponse.text();
        if (fetchResponse.ok) {
          results.push({
            phone: cleanPhone,
            name,
            status: "sent",
            responseSummary: responseText.substring(0, 150)
          });
        } else {
          results.push({
            phone: cleanPhone,
            name,
            status: "failed",
            error: `Gateway returned response error status: ${fetchResponse.status}`,
            responseSummary: responseText.substring(0, 150)
          });
        }
      } catch (err) {
        results.push({
          phone: cleanPhone,
          name,
          status: "failed",
          error: err.message || "Custom HTTP Gateway transmission failed.",
          responseSummary: String(err)
        });
      }
      continue;
    }
    if (gatewayType === "easysend") {
      const {
        easysendApiKey,
        easysendSenderId = "ULTRA",
        easysendUrl = "https://restapi.easysendsms.app/v1/rest/sms/send"
      } = settings || {};
      if (!easysendApiKey) {
        results.push({
          phone: cleanPhone,
          name,
          status: "failed",
          error: "Easy Send API Key is missing in configuration settings.",
          responseSummary: "Configuration Error"
        });
        continue;
      }
      try {
        const payloadJson = {
          api_key: easysendApiKey,
          to: cleanPhone,
          text: finalContent,
          from: easysendSenderId
        };
        const response = await fetch(easysendUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify(payloadJson)
        });
        const responseText = await response.text();
        const isSuccess = response.ok;
        if (isSuccess) {
          results.push({
            phone: cleanPhone,
            name,
            status: "sent",
            responseSummary: `EasySend OK. Msg length: ${finalContent.length} chars. Response: ${responseText.substring(0, 80)}`
          });
        } else {
          results.push({
            phone: cleanPhone,
            name,
            status: "failed",
            error: `EasySend API responded with status ${response.status}`,
            responseSummary: responseText.substring(0, 150)
          });
        }
      } catch (err) {
        results.push({
          phone: cleanPhone,
          name,
          status: "failed",
          error: err.message || "Easy Send API HTTP transmission failure.",
          responseSummary: String(err)
        });
      }
      continue;
    }
    results.push({
      phone: cleanPhone,
      name,
      status: "failed",
      error: "Unsupported gateway type selection.",
      responseSummary: "Framework Mismatch"
    });
  }
  res.json({ success: true, results });
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Ultra Sender Security Proxy Server running at http://localhost:${PORT}`);
  });
}
var server_default = app;
if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error("Critical failure during server initiation:", err);
  });
}
//# sourceMappingURL=server.cjs.map
