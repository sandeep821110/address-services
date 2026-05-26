import * as addressService from "../services/addressService.js";

export const createAddress = async(req,res)=>{

try{

const address = await addressService.createAddress(
req.user.id,
req.body
);

res.status(201).json({
success:true,
address
});

}catch(error){

res.status(400).json({success:false,message:error.message});

}

};

export const getAddresses = async(req,res)=>{

try{

const addresses = await addressService.getUserAddresses(
req.user.id
);

res.json({
success:true,
addresses
});

}catch(error){

res.status(500).json({success:false,message:error.message});

}

};

export const getAddressById = async(req,res)=>{

try{

const address = await addressService.getAddressById(
req.params.id,
req.user.id
);

res.json({
success:true,
address
});

}catch(error){

res.status(404).json({success:false,message:error.message});

}

};

export const updateAddress = async(req,res)=>{

try{

const address = await addressService.updateAddress(
req.params.id,
req.user.id,
req.body
);

res.json({
success:true,
address
});

}catch(error){

res.status(404).json({success:false,message:error.message});

}

};

export const deleteAddress = async(req,res)=>{

try{

await addressService.deleteAddress(
req.params.id,
req.user.id
);

res.json({
success:true,
message:"Address deleted"
});

}catch(error){

res.status(404).json({success:false,message:error.message});

}

};

export const setDefaultAddress = async(req,res)=>{

try{

const address = await addressService.setDefaultAddress(
req.params.id,
req.user.id
);

res.json({
success:true,
address
});

}catch(error){

res.status(400).json({success:false,message:error.message});

}

};