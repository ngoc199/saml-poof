const serviceProviders: ServiceProvider[] = [
  {
    entityId: "http://localhost:8000/",
    callbackUrl: "http://localhost:8000/acs.php",
  },
  {
    entityId: "http://localhost:3000",
    callbackUrl: "http://localhost:3000/login/callback",
  },
  {
    entityId: "urn:federation:MicrosoftOnline",
    callbackUrl: "https://login.microsoftonline.com/login.srf",
  },
  {
    entityId: "https://ngocoder-dev-ed.develop.my.salesforce.com",
    callbackUrl: "https://ngocoder-dev-ed.develop.my.salesforce.com",
  },
];

const findServiceProvider = (entityId: string) => {
  return serviceProviders.find((sp) => sp.entityId === entityId);
};

const getAllServiceProviders = () => {
  return serviceProviders;
};

const addServiceProvider = (serviceProvider: ServiceProvider) => {
  serviceProviders.push(serviceProvider);
};

export const serviceProviderRepo = {
  findServiceProvider,
  addServiceProvider,
  getAllServiceProviders,
};

type ServiceProvider = {
  entityId: string;
  callbackUrl: CallbackURL;
};

type CallbackURL = `http${"s" | ""}://${string}`;
