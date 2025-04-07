import { CreateEmailResponse, Resend } from "resend";
import { httpDelayRequest } from "@/utils/httpClients";
import { checkEmail } from "@/utils/flexDealUtils";

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const RESEND_FROM_ADDRESS = process.env.RESEND_FROM_ADDRESS || "";
if (!RESEND_API_KEY || !RESEND_FROM_ADDRESS) {
  throw new Error("RESEND_API_KEY or RESEND_FROM_ADDRESS is not set");
}

const resendUtils = new Resend(RESEND_API_KEY);

/**
 * resend 发送邮件工具类
 */
export class SendEmailUtils {
  /**
   * 创建钱包发送私钥邮件。
   * @param toEmail 接收方地址
   * @param publicKey 公钥
   * @param privateKeyPiece 私钥片段
   */
  public static async sendWalletEmail(toEmail: string, publicKey: string, privateKeyPiece: string) {
    await this.sendResend(toEmail, "FlexDeal Private Key", this.createWalletEmailTemplate(publicKey, privateKeyPiece));
  }

  /**
   * 发送邮件。
   * @param toEmail 接收方地址
   * @param subject 邮件主题
   * @param html 内容
   * @param fromEmail 发送方地址
   * @private
   */
  private static async sendResend(
    toEmail: string,
    subject: string,
    html: string,
    fromEmail: string = RESEND_FROM_ADDRESS,
  ): Promise<CreateEmailResponse> {
    if (!checkEmail(toEmail)) {
      throw new Error("Email format is invalid");
    }

    // 发送邮件
    const response = await resendUtils.emails.send({
      from: fromEmail,
      to: [toEmail],
      subject: subject,
      html: html,
    });

    const dataId = response.data?.id;
    if (response.error || !dataId) {
      throw "Failed to send email ";
    }

    const emailSuccessStatus = ["clicked", "delivered", "delivery_delayed", "opened"];
    const maxRetries = 5;
    const delayMs = 1000;

    // 封装的重试函数
    const isEmailSuccessful = async () => {
      try {
        const getResult = await resendUtils.emails.get(dataId);
        const lastEvent = getResult?.data?.last_event;
        return lastEvent && emailSuccessStatus.includes(lastEvent);
      } catch (error) {
        console.error("Error fetching email status:", error);
        return false;
      }
    };

    // 重试逻辑
    for (let retries = 0; retries < maxRetries; retries++) {
      const isSuccess = await isEmailSuccessful();

      if (isSuccess) {
        console.log("Email successfully sent and clicked/delivered/opened");
        return response; // 成功时直接返回
      }
      console.log(`Attempt ${retries + 1} failed. Retrying...`);
      // 如果还没有达到最大重试次数，延时 1 秒后重试
      if (retries < maxRetries - 1) {
        await httpDelayRequest(delayMs);
      }
    }

    // 如果重试 5 次后依然失败
    console.log("Failed to get successful email status after 5 retries.");
    throw "Failed to send email ";
  }

  private static generateFormattedDate = (): string => {
    const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" };
    return new Date().toLocaleDateString("en-US", options);
  };

  /**
   * 创建钱包时发送邮件的模版
   * @param publicKey 公钥地址
   * @param keyPairPiece 私钥片段
   * @param data
   * @private
   */
  private static createWalletEmailTemplate(
    publicKey: string,
    keyPairPiece: string,
    data: string = this.generateFormattedDate(),
  ): string {
    return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <title>FlexDeal Key Confirmation</title>
        <style media="all" type="text/css">
        @media all {
          .btn-primary table td:hover {
            background-color: #055bcc !important;
          }
          .btn-primary a:hover {
            background-color: #055bcc !important;
            border-color: #055bcc !important;
          }
        }
        @media only screen and (max-width: 640px) {
          .main p,
          .main td,
          .main span {
            font-size: 16px !important;
          }
          .wrapper {
            padding: 8px !important;
          }
          .content {
            padding: 0 !important;
          }
          .container {
            padding: 0 !important;
            padding-top: 8px !important;
            width: 100% !important;
          }
          .main {
            border-left-width: 0 !important;
            border-radius: 0 !important;
            border-right-width: 0 !important;
          }
          .btn table {
            max-width: 100% !important;
            width: 100% !important;
          }
          .btn a {
            font-size: 16px !important;
            max-width: 100% !important;
            width: 100% !important;
          }
        }
        @media all {
          .ExternalClass {
            width: 100%;
          }
          .ExternalClass,
          .ExternalClass p,
          .ExternalClass span,
          .ExternalClass font,
          .ExternalClass td,
          .ExternalClass div {
            line-height: 100%;
          }
          .apple-link a {
            color: inherit !important;
            font-family: inherit !important;
            font-size: inherit !important;
            font-weight: inherit !important;
            line-height: inherit !important;
            text-decoration: none !important;
          }
          #MessageViewBody a {
            color: inherit;
            text-decoration: none;
            font-size: inherit;
            font-family: inherit;
            font-weight: inherit;
            line-height: inherit;
          }
        }
        </style>
      </head>
      <body style="font-family: Helvetica, sans-serif; background-color: #f4f5f6; margin: 0; padding: 0;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="body" style="background-color: #f4f5f6; width: 100%;">
          <tr>
            <td>&nbsp;</td>
            <td class="container" style="max-width: 600px; padding: 24px; margin: 0 auto;">
              <div class="content" style="max-width: 600px; margin: 0 auto;">
                <span class="preheader" style="display: none;">Your FlexDeal partial private key has been generated.</span>
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="main" style="background: #ffffff; border: 1px solid #eaebed; border-radius: 16px; width: 100%;">
                  <tr>
                    <td class="wrapper" style="padding: 24px;">
                      <h1 style="font-size: 24px; font-weight: bold;">Partial Private Key Confirmation</h1>
                      <p>Dear User,</p>
                      <p>We're confirming that FlexDeal has successfully generated and securely stored a partial private key for your Web3 wallet. This is an important security measure that helps protect your digital assets.</p>
                      <p>Your Web3 wallet details:</p>
                      <div class="key-box" style="background-color: #f8f9fa; border: 1px solid #eaebed; padding: 16px; font-family: monospace;">
                        <strong>Wallet Address:</strong> ${publicKey}<br>
                        <strong>Partial Private Key:</strong> ${keyPairPiece}
                        <strong>Generation Date:</strong> ${data}
                      </div>
                      <div class="warning" style="color: #721c24; background-color: #f8d7da; padding: 12px;">
                        <strong>Important Security Notice:</strong> FlexDeal does not store this private key. You should securely store this partial key for restoring your wallet on a new device or if you lose access to your wallet. Never share your personal key fragment with anyone, including FlexDeal representatives.
                      </div>
                      <p>To access your existing wallet, please use our secure dashboard.</p>
                      <div style="text-align: center;">
                        <a href="https://www.flexdealapp.com/wallet" target="_blank" style="padding: 12px 24px; background-color: #0867ec; color: #ffffff; text-decoration: none; border-radius: 4px;">Access Wallet Dashboard</a>
                      </div>
                      <p>If you have any questions about your wallet security or need assistance, our support team is available 24/7.</p>
                      <p>Thank you for trusting FlexDeal with your digital asset security.</p>
                    </td>
                  </tr>
                </table>
                <div class="footer" style="text-align: center; padding-top: 24px;">
                  <p>FlexDeal Inc.</p>
                  <p>Powered by <a href="https://flexdealapp.com">FlexDeal - Secure Web3 Solutions</a></p>
                </div>
              </div>
            </td>
            <td>&nbsp;</td>
          </tr>
        </table>
      </body>
    </html>
  `;
  }
}
