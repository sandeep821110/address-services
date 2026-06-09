import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
{
user:{
type:mongoose.Schema.Types.ObjectId,
ref:"User",
required:true
},

fullName:{
type:String,
required:true,
trim:true
},

email:{
type:String,
required:true,
trim:true,
validate:{
validator:function(v){
return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
},
message:"Please enter a valid email address"
}
},

phoneNumber:{
type:String,
required:true,
trim:true,
validate:{
validator:function(v){
return /^[6-9]\d{9}$/.test(v);
},
message:"Please enter valid phone number"
}
},

  addressLine1:{
    type:String,
    required:true,
    trim:true
  },

  city:{
    type:String,
    required:true,
    trim:true
  },

  state:{
    type:String,
    required:true,
    trim:true
  },

pincode:{
type:String,
required:true,
trim:true,
validate:{
validator:function(v){
return /^\d{6}$/.test(v);
},
message:"Invalid pincode"
}
},

landmark:{
type:String,
trim:true,
default:""
},

isDefault:{
type:Boolean,
default:false
},


isActive:{
type:Boolean,
default:true
}

},
{timestamps:true}
);


addressSchema.index({ user: 1 });
addressSchema.index({ pincode: 1 });
// Remove unique constraint on email, allow multiple addresses with same email
// addressSchema.index({user:1,email:1},{unique:true});

// Ensure only one default address per user
addressSchema.index(
	{ user: 1, isDefault: 1 },
	{ unique: true, partialFilterExpression: { isDefault: true } }
);

const Address = mongoose.model("Address",addressSchema);

export default Address;