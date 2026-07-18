import Setting from '../models/Setting.js';

export const getSettings = async (req, res, next) => {
    try {
        let settings = await Setting.findOne();
        if (!settings) {
            settings = await Setting.create({});
        }
        res.json({ success: true, settings });
    } catch (error) {
        next(error);
    }
};

export const updateSettings = async (req, res, next) => {
    try {
        let settings = await Setting.findOne();
        if (!settings) {
            settings = await Setting.create({});
        }

        const { orgName, currency, timezone, taxRate, gracePeriodMinutes, lateFeeChargeType, lateFeeMultiplier, maxLateFeeLimit, rentalPolicy } = req.body;

        if (orgName) settings.orgName = orgName;
        if (currency) settings.currency = currency;
        if (timezone) settings.timezone = timezone;
        if (taxRate !== undefined) settings.taxRate = Number(taxRate);
        if (gracePeriodMinutes !== undefined) settings.gracePeriodMinutes = Number(gracePeriodMinutes);
        if (lateFeeChargeType) settings.lateFeeChargeType = lateFeeChargeType;
        if (lateFeeMultiplier !== undefined) settings.lateFeeMultiplier = Number(lateFeeMultiplier);
        if (maxLateFeeLimit !== undefined) settings.maxLateFeeLimit = Number(maxLateFeeLimit);
        if (rentalPolicy) settings.rentalPolicy = rentalPolicy;

        await settings.save();

        res.json({ success: true, message: 'Global settings updated successfully', settings });
    } catch (error) {
        next(error);
    }
};
