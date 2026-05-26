import express from "express";
import * as addressController from "../controllers/addressController.js";
import authMiddleware from "../middleware/authMiddleware.js";



const router = express.Router();

router.use(authMiddleware);

router.post("/",addressController.createAddress);

router.get("/",addressController.getAddresses);

router.get("/:id",addressController.getAddressById);

router.put("/:id",addressController.updateAddress);

router.delete("/:id",addressController.deleteAddress);

router.patch("/:id/default",addressController.setDefaultAddress);

export default router;