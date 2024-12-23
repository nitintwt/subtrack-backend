import { google } from "googleapis";
import PdfParse from "pdf-parse";

export const getGmailClient = (tokens: any) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URL
  );
  oauth2Client.setCredentials(tokens);
  return google.gmail({ version: "v1", auth: oauth2Client })
}

export const fetchEmails = async (gmail: any, query: string) => {
  const response = await gmail.users.messages.list({ userId: "me", q: query })
  return response.data.messages || []
}

export const fetchAttachments = async (gmail: any, emailId: string) => {
  const message = await gmail.users.messages.get({ userId: "me", id: emailId })
  const parts = message.data.payload?.parts || []
  return parts
    .filter((part:any) => part.body?.attachmentId)
    .map((part:any) => ({
      attachmentId: part.body.attachmentId,
      filename: part.filename,
      mimeType: part.mimeType,
    }))
}

export const getAttachmentContent = async (
  gmail: any,
  emailId: string,
  attachmentId: string
) => {
  const response = await gmail.users.messages.attachments.get({
    userId: "me",
    messageId: emailId,
    id: attachmentId,
  })
  const buffer = Buffer.from(response.data.data!, "base64")
  const pdfText = await PdfParse(buffer)
  return pdfText.text
}
