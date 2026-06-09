import { jest } from '@jest/globals';

const mockAddressService = {
  createAddress: jest.fn(),
  getUserAddresses: jest.fn(),
  getAddressById: jest.fn(),
  updateAddress: jest.fn(),
  deleteAddress: jest.fn(),
  setDefaultAddress: jest.fn(),
};

jest.unstable_mockModule('../src/services/addressService.js', () => mockAddressService);

const addressController = await import('../src/controllers/addressController.js');

describe('addressController', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      user: { id: 'user1', email: 'test@example.com' },
      params: {},
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe('createAddress', () => {
    it('returns 201 and address on success', async () => {
      const address = { _id: 'addr1', fullName: 'John' };
      mockAddressService.createAddress.mockResolvedValue(address);
      req.body = { fullName: 'John', phoneNumber: '9876543210' };

      await addressController.createAddress(req, res);

      expect(mockAddressService.createAddress).toHaveBeenCalledWith('user1', 'test@example.com', req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, address });
    });

    it('returns 400 on service error', async () => {
      mockAddressService.createAddress.mockRejectedValue(new Error('Phone already exists'));
      req.body = { phoneNumber: '9876543210' };

      await addressController.createAddress(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Phone already exists' });
    });
  });

  describe('getAddresses', () => {
    it('returns addresses list', async () => {
      const addresses = [{ _id: 'a1' }, { _id: 'a2' }];
      mockAddressService.getUserAddresses.mockResolvedValue(addresses);

      await addressController.getAddresses(req, res);

      expect(mockAddressService.getUserAddresses).toHaveBeenCalledWith('user1');
      expect(res.json).toHaveBeenCalledWith({ success: true, addresses });
    });

    it('returns 500 on service error', async () => {
      mockAddressService.getUserAddresses.mockRejectedValue(new Error('DB error'));

      await addressController.getAddresses(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'DB error' });
    });
  });

  describe('getAddressById', () => {
    it('returns address by id', async () => {
      const address = { _id: 'addr1' };
      mockAddressService.getAddressById.mockResolvedValue(address);
      req.params.id = 'addr1';

      await addressController.getAddressById(req, res);

      expect(mockAddressService.getAddressById).toHaveBeenCalledWith('addr1', 'user1');
      expect(res.json).toHaveBeenCalledWith({ success: true, address });
    });

    it('returns 404 when not found', async () => {
      mockAddressService.getAddressById.mockRejectedValue(new Error('Address not found'));
      req.params.id = 'nonexistent';

      await addressController.getAddressById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('updateAddress', () => {
    it('returns updated address', async () => {
      const address = { _id: 'addr1', fullName: 'Updated' };
      mockAddressService.updateAddress.mockResolvedValue(address);
      req.params.id = 'addr1';
      req.body = { fullName: 'Updated' };

      await addressController.updateAddress(req, res);

      expect(mockAddressService.updateAddress).toHaveBeenCalledWith('addr1', 'user1', req.body);
      expect(res.json).toHaveBeenCalledWith({ success: true, address });
    });

    it('returns 404 when not found', async () => {
      mockAddressService.updateAddress.mockRejectedValue(new Error('Address not found'));
      req.params.id = 'nonexistent';

      await addressController.updateAddress(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('deleteAddress', () => {
    it('returns success on delete', async () => {
      mockAddressService.deleteAddress.mockResolvedValue({ _id: 'addr1' });
      req.params.id = 'addr1';

      await addressController.deleteAddress(req, res);

      expect(mockAddressService.deleteAddress).toHaveBeenCalledWith('addr1', 'user1');
      expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Address deleted' });
    });

    it('returns 404 when not found', async () => {
      mockAddressService.deleteAddress.mockRejectedValue(new Error('Address not found'));
      req.params.id = 'nonexistent';

      await addressController.deleteAddress(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('setDefaultAddress', () => {
    it('marks address as default', async () => {
      const address = { _id: 'addr1', isDefault: true };
      mockAddressService.setDefaultAddress.mockResolvedValue(address);
      req.params.id = 'addr1';

      await addressController.setDefaultAddress(req, res);

      expect(mockAddressService.setDefaultAddress).toHaveBeenCalledWith('addr1', 'user1');
      expect(res.json).toHaveBeenCalledWith({ success: true, address });
    });

    it('returns 400 on service error', async () => {
      mockAddressService.setDefaultAddress.mockRejectedValue(new Error('Address not found'));
      req.params.id = 'nonexistent';

      await addressController.setDefaultAddress(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Address not found' });
    });
  });
});
