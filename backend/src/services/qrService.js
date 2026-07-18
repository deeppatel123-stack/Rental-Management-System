import QRCode from 'qrcode';


export const generateQRCode = async (text) => {
    try {
        const dataUrl = await QRCode.toDataURL(text);
        return dataUrl;
    } catch (error) {
        console.error(`🚨 Error generating QR code: ${error.message}`);
        return '';
    }
};
