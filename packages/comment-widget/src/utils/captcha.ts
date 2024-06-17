// const handleCaptcha = async (response: Response) => {
//   if (isRequireCaptcha(response)) {
//     // const imageBase64 = await response.text();
//   }
// };

export const isRequireCaptcha = (response: Response) => {
  return response.status === 403 && response.headers.get('X-Require-Captcha');
};
