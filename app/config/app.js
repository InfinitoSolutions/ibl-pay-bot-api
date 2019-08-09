module.exports = {
  // Expired time for a token
  JWT_EXPIRED_TIME: '1h',
  JWT_DOWNLOAD_EXPIRED_TIME: '2s',
  JWT_EXPORT_FILE_EXPIRE_TIME: '60s',

  // Limit the number of records allowed to be exported directly
  // otherwise we'll need to put the task to queue
  DIRECT_EXPORT_LIMIT: 1000,
  PER_FILE_EXPORT_LIMIT: 5000,

  // Default values which will be set for merchant contracts
  DEFAULT_MERCHANT_COMMISSION_RATE: 1,
  DEFAULT_MERCHANT_WITHDRAWAL_PERIOD: 'MONTHLY',
  DEFAULT_MERCHANT_WITHDRAWAL_REPEAT_ON: '1',
  RECOVERY_CODE_EXPIRATION: 1, // Day

  // Default decimal number
  DEFAULT_DECIMAL_NUMBER: 8,

  // Default Level KYC (deactive = 1, active = 2, level1 = 3, level2 = 4, level3 = 5)
  DEFAULT_KYC_LEVEL: 2,

  // Format date
  FORMAT_DATE_TIME: 'MM/DD/YYYY hh:mm A',
  FORMAT_DATE:'MM/DD/YYYY',

  // User status
  USER_STATUS: {
    PRE_ACTIVE: 'pre_active',
    ACTIVE: 'active',
    INACTIVE: 'inactive'
  },

  BUYER_STATUS: {
    ACTIVE: 'active',
    PRE_ACTIVE: 'pre-active',
    FROZEN: 'frozen',
    BLOCKED: 'blocked'
  },

  // Transaction status
  TRANSACTION_STATUS: {
    NEW: 'NEW',
    PENDING: 'PENDING',
    REJECTED: 'REJECTED',
    BLOCKED: 'BLOCKED',
    APPROVED: 'APPROVED',
    PROCESSING: 'PROCESSING',
    FAILED: 'FAILED',
    PROCESSED: 'PROCESSED',
    WAITING: 'WAITING',
    CANCELLED: 'CANCELLED',
    COMPLETED: 'COMPLETED',
    CONFIRMED: 'CONFIRMED'
  },

  TRANSACTION_TYPE: {
    PAYMENT: 'PAYMENT',
    DEPOSIT: 'DEPOSIT',
    WITHDRAW: 'WITHDRAW',
    TRANSFER: 'TRANSFER'
  },

  BILL_TYPE: {
    INSTANT: 'INSTANT',
    SCHEDULE: 'SCHEDULE'
  },

  CURRENCY: {
    NEO: 'NEO',
    ETH: 'ETH',
    BTC: 'BTC'
  },

  EXPORT_HEADER: {
    BUYER: [
      'ID',
      'NAME',
      'EMAIL',
      'JOINED DATE',
      'CURRENCY',
      'AVAILABLE BALANCE',
      'REGISTED CRYPTO ADDRESS',
      'LAST TXN DATE',
      'STATUS'
    ],
    TRANSACTION_HISTORY: [
      'ID', 
      'DATE', 
      'TRANSACTION TYPE', 
      'FROM-NAME', 
      'FROM-EMAIL', 
      'TO-NAME', 
      'TO-EMAIL', 
      'STATUS', 
      'CURRENCY', 
      'AMOUNT'
    ],
    TRANSACTION_UPCOMING: [
      'AVAILABLE DATE',
      'FROM-NAME', 
      'FROM-EMAIL', 
      'TO-NAME', 
      'TO-EMAIL',
      'CURRENCY', 
      'AMOUNT',
      'ORIGIN ID'
    ],
    REVENUE: [
      'BUYER ID',
      'NAME',
      'EMAIL',
      'NUMER TX',
      'AVERAGE COMMISSION RATE',
      'CRYPTO CURRENCY',
      'CCY COMMISSION AMOUNT',
      'FCY COMMISSION AMOUNT',
      'WITHDRAWAL COST',
      'TRANSACTION COST'
    ],
    USER: [
      'NAME',
      'ROLE',
      'EMAIL',
      'STATUS',
      'CREATED DATE',
      'CREATED BY'
    ]
  }
};
