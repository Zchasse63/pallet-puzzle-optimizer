// Mock implementation for sonner toast
const toast = {
  success: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warning: jest.fn(),
  promise: jest.fn(),
  custom: jest.fn(),
  dismiss: jest.fn()
};

module.exports = {
  toast,
  Toaster: () => null
};
