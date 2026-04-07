declare module 'iyzipay' {
  interface IyzipayConfig {
    apiKey: string;
    secretKey: string;
    uri: string;
  }

  interface CheckoutFormInitializeRequest {
    locale: string;
    conversationId: string;
    price: string;
    paidPrice: string;
    currency: string;
    basketId: string;
    paymentGroup: string;
    callbackUrl: string;
    buyer: {
      id: string;
      name: string;
      surname: string;
      gsmNumber: string;
      email: string;
      identityNumber: string;
      registrationAddress: string;
      ip: string;
      city: string;
      country: string;
    };
    shippingAddress: {
      contactName: string;
      city: string;
      country: string;
      address: string;
    };
    billingAddress: {
      contactName: string;
      city: string;
      country: string;
      address: string;
    };
    basketItems: Array<{
      id: string;
      name: string;
      category1: string;
      itemType: string;
      price: string;
    }>;
  }

  interface CheckoutFormInitializeResult {
    status: string;
    errorCode?: string;
    errorMessage?: string;
    checkoutFormContent: string;
    token: string;
    tokenExpireTime: number;
  }

  interface CheckoutFormRetrieveResult {
    status: string;
    errorCode?: string;
    errorMessage?: string;
    basketId: string;
    buyer: { id: string; email: string };
    basketItems: Array<{ id: string; name: string; price: string }>;
    paymentStatus: string;
  }

  class Iyzipay {
    static LOCALE: { TR: string; EN: string };
    static CURRENCY: { TRY: string; EUR: string; USD: string; GBP: string };
    static PAYMENT_GROUP: { PRODUCT: string; LISTING: string; SUBSCRIPTION: string };
    static BASKET_ITEM_TYPE: { PHYSICAL: string; VIRTUAL: string };

    constructor(config: IyzipayConfig);

    checkoutFormInitialize: {
      create(
        request: CheckoutFormInitializeRequest,
        callback: (err: Error | null, result: CheckoutFormInitializeResult) => void
      ): void;
    };

    checkoutForm: {
      retrieve(
        request: { token: string },
        callback: (err: Error | null, result: CheckoutFormRetrieveResult) => void
      ): void;
    };
  }

  export = Iyzipay;
}
