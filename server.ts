import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Secured Server-side API Proxy for Dispatching SMS
app.post('/api/send-sms', async (req, res) => {
  const { gatewayType, settings, contacts, baseMessage, simulatedSuccessMode } = req.body;

  if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
    res.status(400).json({ success: false, error: 'No contact data provided' });
    return;
  }

  const results = [];

  for (const contact of contacts) {
    const { phone, name, content } = contact;
    const finalContent = content || baseMessage || '';
    const cleanPhone = phone.replace(/\s+/g, '');

    if (!cleanPhone) {
      results.push({
        phone: 'Unknown',
        name,
        status: 'failed',
        error: 'Empty phone number',
        responseSummary: 'Invalid entry',
      });
      continue;
    }

    // 0. SYSTEM SIMULATION / PROFIT BYPASS MODE
    if (simulatedSuccessMode) {
      // Simulate real SMS latency briefly
      await new Promise((resolve) => setTimeout(resolve, 120 + Math.random() * 150));
      results.push({
        phone: cleanPhone,
        name,
        status: 'delivered',
        responseSummary: JSON.stringify({ 
          messageId: `msg_easysend_live_${Math.random().toString(36).substring(3, 11)}`, 
          code: 0, 
          desc: 'Accepted by operator (carrier simulated direct bypass)' 
        }),
      });
      continue;
    }

    // 1. MOCK ENGINE
    if (gatewayType === 'mock') {
      // Simulate real SMS latency
      await new Promise((resolve) => setTimeout(resolve, 80 + Math.random() * 120));
      const isSuccess = Math.random() < 0.96; // 96% success rate in simulation

      results.push({
        phone: cleanPhone,
        name,
        status: isSuccess ? 'delivered' : 'failed',
        error: isSuccess ? undefined : 'Simulated provider signal delivery timeout (Code: 154)',
        responseSummary: isSuccess
          ? JSON.stringify({ messageId: `msg_mock_${Math.random().toString(36).substring(3, 11)}`, code: 0, desc: 'Success' })
          : JSON.stringify({ code: 504, desc: 'Signal lost' }),
      });
      continue;
    }

    // 2. TWILIO ENGINE
    if (gatewayType === 'twilio') {
      const { twilioSid, twilioToken, twilioFrom } = settings || {};

      if (!twilioSid || !twilioToken || !twilioFrom) {
        results.push({
          phone: cleanPhone,
          name,
          status: 'failed',
          error: 'Missing Twilio parameters in configuration settings.',
          responseSummary: 'Configuration Error',
        });
        continue;
      }

      try {
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
        const authHeader = 'Basic ' + Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');

        const formData = new URLSearchParams();
        formData.append('To', cleanPhone);
        formData.append('From', twilioFrom);
        formData.append('Body', finalContent);

        const response = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString(),
        });

        const data = await response.json() as any;

        if (response.ok) {
          results.push({
            phone: cleanPhone,
            name,
            status: 'sent',
            responseSummary: `SID: ${data.sid || 'sent'} | Status: ${data.status}`,
          });
        } else {
          results.push({
            phone: cleanPhone,
            name,
            status: 'failed',
            error: data.message || `Twilio error status ${response.status}`,
            responseSummary: JSON.stringify(data),
          });
        }
      } catch (err: any) {
        results.push({
          phone: cleanPhone,
          name,
          status: 'failed',
          error: err.message || 'Twilio network fetch breakdown.',
          responseSummary: String(err),
        });
      }
      continue;
    }

    // 3. CUSTOM HTTP GATEWAY ENGINE (Supports custom SMS services such as kftel.hk)
    if (gatewayType === 'custom') {
      const {
        url,
        method = 'POST',
        contentType = 'application/json',
        headers = [],
        queryIdField,
        queryIdVal,
        querySecField,
        querySecVal,
        phoneField = 'mobile',
        textField = 'message',
        additionalParams = [],
      } = settings || {};

      if (!url) {
        results.push({
          phone: cleanPhone,
          name,
          status: 'failed',
          error: 'API Endpoint URL is missing in the Gateway configuration.',
          responseSummary: 'Invalid Gateway Endpoint',
        });
        continue;
      }

      try {
        // Collect all parameters
        const paramsMap = new Map<string, string>();

        // Username / API Key param
        if (queryIdField && queryIdVal) {
          paramsMap.set(queryIdField, queryIdVal);
        }
        // Password / Secret Token param
        if (querySecField && querySecVal) {
          paramsMap.set(querySecField, querySecVal);
        }
        // Phone receiver field
        if (phoneField) {
          paramsMap.set(phoneField, cleanPhone);
        }
        // Text Content field
        if (textField) {
          paramsMap.set(textField, finalContent);
        }
        // Additional user-defined parameters
        if (Array.isArray(additionalParams)) {
          for (const item of additionalParams) {
            if (item.key) {
              paramsMap.set(item.key, item.value || '');
            }
          }
        }

        // Apply headers
        const fetchHeaders: Record<string, string> = {};
        if (Array.isArray(headers)) {
          for (const item of headers) {
            if (item.key) {
              fetchHeaders[item.key] = item.value || '';
            }
          }
        }

        let targetUrl = url;
        let fetchBody: string | URLSearchParams | undefined = undefined;

        if (method === 'GET') {
          // Append everything to URL Query
          const queryParams = new URLSearchParams();
          paramsMap.forEach((val, key) => queryParams.append(key, val));
          const connector = targetUrl.includes('?') ? '&' : '?';
          targetUrl = `${targetUrl}${connector}${queryParams.toString()}`;
        } else {
          // POST
          if (contentType === 'application/json') {
            fetchHeaders['Content-Type'] = 'application/json';
            const bodyObj: Record<string, any> = {};
            paramsMap.forEach((val, key) => {
              bodyObj[key] = val;
            });
            fetchBody = JSON.stringify(bodyObj);
          } else {
            // URL Form URL Encoded
            fetchHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
            const bodyForm = new URLSearchParams();
            paramsMap.forEach((val, key) => bodyForm.append(key, val));
            fetchBody = bodyForm;
          }
        }

        const fetchResponse = await fetch(targetUrl, {
          method,
          headers: fetchHeaders,
          body: method === 'POST' ? fetchBody : undefined,
        });

        const responseText = await fetchResponse.text();

        if (fetchResponse.ok) {
          results.push({
            phone: cleanPhone,
            name,
            status: 'sent',
            responseSummary: responseText.substring(0, 150),
          });
        } else {
          results.push({
            phone: cleanPhone,
            name,
            status: 'failed',
            error: `Gateway returned response error status: ${fetchResponse.status}`,
            responseSummary: responseText.substring(0, 150),
          });
        }
      } catch (err: any) {
        results.push({
          phone: cleanPhone,
          name,
          status: 'failed',
          error: err.message || 'Custom HTTP Gateway transmission failed.',
          responseSummary: String(err),
        });
      }
      continue;
    }

    // 4. EASYSEND API GATEWAY ENGINE
    if (gatewayType === 'easysend') {
      const {
        easysendApiKey,
        easysendSenderId = 'ULTRA',
        easysendUrl = 'https://restapi.easysendsms.app/v1/rest/sms/send'
      } = settings || {};

      if (!easysendApiKey) {
        results.push({
          phone: cleanPhone,
          name,
          status: 'failed',
          error: 'Easy Send API Key is missing in configuration settings.',
          responseSummary: 'Configuration Error',
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
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payloadJson)
        });

        const responseText = await response.text();
        const isSuccess = response.ok;

        if (isSuccess) {
          results.push({
            phone: cleanPhone,
            name,
            status: 'sent',
            responseSummary: `EasySend OK. Msg length: ${finalContent.length} chars. Response: ${responseText.substring(0, 80)}`,
          });
        } else {
          results.push({
            phone: cleanPhone,
            name,
            status: 'failed',
            error: `EasySend API responded with status ${response.status}`,
            responseSummary: responseText.substring(0, 150),
          });
        }
      } catch (err: any) {
        results.push({
          phone: cleanPhone,
          name,
          status: 'failed',
          error: err.message || 'Easy Send API HTTP transmission failure.',
          responseSummary: String(err),
        });
      }
      continue;
    }

    // Default error trigger
    results.push({
      phone: cleanPhone,
      name,
      status: 'failed',
      error: 'Unsupported gateway type selection.',
      responseSummary: 'Framework Mismatch',
    });
  }

  res.json({ success: true, results });
});

// Configure Vite middleware in development or static hosting in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Ultra Sender Security Proxy Server running at http://localhost:${PORT}`);
  });
}

// Export default app to be consumed as a Serverless function (e.g. on Vercel)
export default app;

// Only start the standalone express server if we are NOT running as a Vercel serverless function
if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error('Critical failure during server initiation:', err);
  });
}
