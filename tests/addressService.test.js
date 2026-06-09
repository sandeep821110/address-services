import { jest } from '@jest/globals';

const mockAddress = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  findOneAndDelete: jest.fn(),
  updateMany: jest.fn(),
};

jest.unstable_mockModule('../src/models/addressModel.js', () => ({
  default: mockAddress,
}));

const addressService = await import('../src/services/addressService.js');

describe('addressService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createAddress', () => {
    const userId = 'user123';
    const data = {
      fullName: 'John Doe',
      email: 'john@example.com',
      phoneNumber: '9876543210',
      addressLine1: '123 Main St',
      city: 'Mumbai',
      pincode: '400001',
    };

    const expectedCreatePayload = (overrides = {}) => ({
      fullName: data.fullName,
      phoneNumber: data.phoneNumber,
      addressLine1: data.addressLine1,
      city: data.city,
      pincode: data.pincode,
      email: data.email,
      user: userId,
      ...overrides,
    });

    it('creates address when no duplicate phone', async () => {
      mockAddress.findOne.mockResolvedValue(null);
      const created = { _id: 'addr1', ...expectedCreatePayload() };
      mockAddress.create.mockResolvedValue(created);

      const result = await addressService.createAddress(userId, data.email, data);

      expect(mockAddress.create).toHaveBeenCalledWith(expectedCreatePayload());
      expect(result).toEqual(created);
    });

    it('unmarks other defaults when isDefault is true', async () => {
      mockAddress.create.mockResolvedValue({ _id: 'addr2', ...expectedCreatePayload({ isDefault: true }) });

      await addressService.createAddress(userId, data.email, { ...data, isDefault: true });

      expect(mockAddress.updateMany).toHaveBeenCalledWith(
        { user: userId },
        { $set: { isDefault: false } }
      );
    });

    it('does not unmark defaults when isDefault is false', async () => {
      mockAddress.findOne.mockResolvedValue(null);
      mockAddress.create.mockResolvedValue({ _id: 'addr3', ...expectedCreatePayload({ isDefault: false }) });

      await addressService.createAddress(userId, data.email, { ...data, isDefault: false });

      expect(mockAddress.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('getUserAddresses', () => {
    it('returns active addresses sorted by isDefault', async () => {
      const addresses = [{ _id: 'a1', isDefault: true }, { _id: 'a2', isDefault: false }];
      mockAddress.find.mockReturnValue({ sort: jest.fn().mockResolvedValue(addresses) });

      const result = await addressService.getUserAddresses('user1');

      expect(mockAddress.find).toHaveBeenCalledWith({ user: 'user1', isActive: true });
      expect(result).toEqual(addresses);
    });

    it('returns empty array when user has no addresses', async () => {
      mockAddress.find.mockReturnValue({ sort: jest.fn().mockResolvedValue([]) });

      const result = await addressService.getUserAddresses('user1');

      expect(result).toEqual([]);
    });
  });

  describe('getAddressById', () => {
    it('returns address when found', async () => {
      const address = { _id: 'addr1', user: 'user1', fullName: 'John' };
      mockAddress.findOne.mockResolvedValue(address);

      const result = await addressService.getAddressById('addr1', 'user1');

      expect(mockAddress.findOne).toHaveBeenCalledWith({ _id: 'addr1', user: 'user1', isActive: true });
      expect(result).toEqual(address);
    });

    it('throws when address not found', async () => {
      mockAddress.findOne.mockResolvedValue(null);

      await expect(addressService.getAddressById('nonexistent', 'user1')).rejects.toThrow('Address not found');
    });
  });

  describe('updateAddress', () => {
    it('updates address fields', async () => {
      const address = { _id: 'addr1', user: 'user1', fullName: 'Old Name', isDefault: false, save: jest.fn() };
      mockAddress.findOne.mockResolvedValue(address);

      const result = await addressService.updateAddress('addr1', 'user1', { fullName: 'New Name' });

      expect(mockAddress.findOne).toHaveBeenCalledWith({ _id: 'addr1', user: 'user1' });
      expect(address.fullName).toBe('New Name');
      expect(address.save).toHaveBeenCalled();
      expect(result.fullName).toBe('New Name');
    });

    it('unmarks other defaults when setting isDefault', async () => {
      const address = { _id: 'addr1', user: 'user1', isDefault: false, save: jest.fn() };
      mockAddress.findOne.mockResolvedValue(address);

      await addressService.updateAddress('addr1', 'user1', { isDefault: true });

      expect(mockAddress.updateMany).toHaveBeenCalledWith(
        { user: 'user1' },
        { $set: { isDefault: false } }
      );
    });

    it('does not unmark defaults when already default', async () => {
      const address = { _id: 'addr1', user: 'user1', isDefault: true, save: jest.fn() };
      mockAddress.findOne.mockResolvedValue(address);

      await addressService.updateAddress('addr1', 'user1', { isDefault: true });

      expect(mockAddress.updateMany).not.toHaveBeenCalled();
    });

    it('throws when address not found', async () => {
      mockAddress.findOne.mockResolvedValue(null);

      await expect(addressService.updateAddress('nonexistent', 'user1', {})).rejects.toThrow('Address not found');
    });
  });

  describe('deleteAddress', () => {
    it('deletes address when found', async () => {
      const address = { _id: 'addr1', user: 'user1' };
      mockAddress.findOneAndDelete.mockResolvedValue(address);

      const result = await addressService.deleteAddress('addr1', 'user1');

      expect(mockAddress.findOneAndDelete).toHaveBeenCalledWith({ _id: 'addr1', user: 'user1' });
      expect(result).toEqual(address);
    });

    it('throws when address not found', async () => {
      mockAddress.findOneAndDelete.mockResolvedValue(null);

      await expect(addressService.deleteAddress('nonexistent', 'user1')).rejects.toThrow('Address not found');
    });
  });

  describe('setDefaultAddress', () => {
    it('sets address as default and unsets others', async () => {
      const address = { _id: 'addr1', user: 'user1', isDefault: false, save: jest.fn() };
      mockAddress.findOne.mockResolvedValue(address);

      const result = await addressService.setDefaultAddress('addr1', 'user1');

      expect(mockAddress.findOne).toHaveBeenCalledWith({ _id: 'addr1', user: 'user1' });
      expect(mockAddress.updateMany).toHaveBeenCalledWith(
        { user: 'user1' },
        { $set: { isDefault: false } }
      );
      expect(address.isDefault).toBe(true);
      expect(address.save).toHaveBeenCalled();
      expect(result).toEqual(address);
    });

    it('throws when address not found', async () => {
      mockAddress.findOne.mockResolvedValue(null);

      await expect(addressService.setDefaultAddress('nonexistent', 'user1')).rejects.toThrow('Address not found');
    });
  });
});
