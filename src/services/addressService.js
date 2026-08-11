import Address from "../models/addressModel.js";

const ALLOWED_FIELDS = [
    "fullName",
    "phoneNumber",
    "addressLine1",
    "city",
    "state",
    "pincode",
    "landmark",
    "isDefault",
];

const pickAddressFields = (data) => {
    const result = {};
    for (const key of ALLOWED_FIELDS) {
        if (data[key] !== undefined) result[key] = data[key];
    }
    return result;
};

export const createAddress = async (userId, email, data) => {
    const fields = pickAddressFields(data);

    if (fields.isDefault) {
        await Address.updateMany(
            { user: userId },
            { $set: { isDefault: false } }
        );
    }

    const address = await Address.create({
        ...fields,
        email,
        user: userId
    });

    return address;
};

export const getUserAddresses = async(userId)=>{

return await Address.find({
user:userId,
isActive:true
}).sort({isDefault:-1});

};

export const getAddressById = async(id, userId) => {
    const address = await Address.findOne({
        _id: id,
        user: userId,
        isActive: true
    });

    if (!address) {
        throw new Error("Address not found");
    }

    return address;
};

export const updateAddress = async(id, userId, data) => {
    const address = await Address.findOne({
        _id: id,
        user: userId
    });

    if (!address) {
        throw new Error("Address not found");
    }

    // Only update others if this address is not already default and is being set as default
    const fields = pickAddressFields(data);

    if (fields.isDefault && !address.isDefault) {
        await Address.updateMany(
            { user: userId },
            { $set: { isDefault: false } }
        );
    }

    Object.assign(address, fields);
    await address.save();
    return address;
};

export const deleteAddress = async(id, userId) => {
    const address = await Address.findOneAndDelete({ _id: id, user: userId });
    if (!address) {
        throw new Error("Address not found");
    }
    return address;
};

export const setDefaultAddress = async(id, userId) => {
    const address = await Address.findOne({ _id: id, user: userId });
    if (!address) {
        throw new Error("Address not found");
    }

    await Address.updateMany(
        { user: userId },
        { $set: { isDefault: false } }
    );

    address.isDefault = true;
    await address.save();
    return address;
};