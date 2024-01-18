import crypto from "node:crypto";
import { Router } from "express";
// NOTE: This is the library that we are using to handle SAML
// https://www.npmjs.com/package/samlp
// Read the SAML Specifications at https://saml.xml.org/saml-specifications
import samlp from "samlp";
import fs from "node:fs";
import path from "node:path";
import { userIsAuthenticated } from "../../middlewares/user-is-authenticated";
import { userRepo } from "../auth/user.repo";
import { serviceProviderRepo } from "./service-provider.repo";

export const samlRouter = Router();

const IDP_PATHS = {
  SSO: "/sso",
  SLO: "/slo",
  METADATA: "/metadata",
};

const idpOptions = {
  issuer: "urn:testsaml:accounts",
  cert: fs.readFileSync(path.join(__dirname, "../../../public_cert.pem")),
  key: fs.readFileSync(path.join(__dirname, "../../../private_key.pem")),
  postEndpointPath: "/saml/sso",
  redirectEndpointPath: "/saml/sso",
};

samlRouter.get(
  IDP_PATHS.METADATA,
  samlp.metadata({
    issuer: idpOptions.issuer,
    cert: idpOptions.cert,
    postEndpointPath: idpOptions.postEndpointPath,
    logoutEndpointPaths: { post: "/saml/slo" },
    redirectEndpointPath: idpOptions.redirectEndpointPath,
  })
);

samlRouter.get("/sso", userIsAuthenticated, (req, res, next) => {
  return samlp.auth({
    issuer: idpOptions.issuer,
    cert: idpOptions.cert,
    key: idpOptions.key,
    getPostURL: (entityId, authnRequestDom, req, callback) => {
      const serviceProvider = serviceProviderRepo.findServiceProvider(entityId);
      // The `callback` will send the 500 Internal Server Error if there are any error
      // We should send the 401 error by passing the `postUrl` with `null` value if the service provider is invalid
      // @ts-ignore
      return callback(null, serviceProvider?.callbackUrl);
    },
    getUserFromRequest: (req) => {
      // Here you should fetch the user from your database
      const user = userRepo.findUserById((req.user as any).id);
      if (!user) return undefined;
      return {
        id: user.id,
        name: user.name,
        emails: [user.email],
      };
    },
    // @ts-ignore
    responseHandler: (samlResponse, opts, req, res, next) => {
      const nonce = crypto.randomBytes(16).toString("base64");
      res.setHeader(
        "Content-Security-Policy",
        `default-src 'self'; script-src 'nonce-${nonce}'`
      );
      res.render("samlResponse", {
        AcsUrl: opts.postUrl,
        SAMLResponse: samlResponse.toString("base64"),
        RelayState: opts.RelayState,
        nonce,
      });
    },
  })(req, res, next);
});

samlRouter.get(
  "/slo",
  samlp.logout({
    key: idpOptions.key,
    cert: idpOptions.cert,
    issuer: idpOptions.issuer,
    getPostURL: (audience, logoutRequestDom, req, callback) => {
      return callback(null, "your-sp-slo-url");
    },
  })
);

samlRouter.get("/service-providers", (req, res) => {
  const serviceProviders = serviceProviderRepo.getAllServiceProviders();
  res.render("serviceProviders", { serviceProviders });
});

samlRouter.post("/service-providers", (req, res) => {
  const { entityId, callbackUrl } = req.body;
  serviceProviderRepo.addServiceProvider({ entityId, callbackUrl });
  res.redirect("/saml/service-providers");
});
