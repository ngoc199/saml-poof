const serviceProviders: ServiceProvider[] = [
  {
    entityId: "http://localhost:8000/",
    callbackUrl: "http://localhost:8000/acs.php",
  },
  {
    entityId: "http://localhost:3000",
    callbackUrl: "http://localhost:3000/login/callback",
  },
];

const findServiceProvider = (entityId: string) => {
  return serviceProviders.find((sp) => sp.entityId === entityId);
};

export const serviceProviderRepo = {
  findServiceProvider,
};

type ServiceProvider = {
  entityId: string;
  callbackUrl: CallbackURL;
};

type CallbackURL = `http${"s" | ""}://${string}`;
