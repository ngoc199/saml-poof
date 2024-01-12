import crypto from "node:crypto";
import { Router } from "express";
// NOTE: This is the library that we are using to handle SAML
// https://www.npmjs.com/package/samlp
// Read the SAML Specifications at https://saml.xml.org/saml-specifications
import samlp from "samlp";
import fs from "node:fs";
import path from "node:path";

export const samlRouter = Router();

const IDP_PATHS = {
  SSO: "/saml/sso",
  SLO: "/saml/slo",
  METADATA: "/saml/metadata",
};

const idpOptions = {
  issuer: "unique-saml-issuer",
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

// samlRouter.get(["/", IDP_PATHS.SSO], (req, res, next) => {
//   samlp.parseRequest(req, (err, data) => {
//     if (err) {
//       return res.render("error", {
//         message: "SAML AuthnRequest Parse Error: " + err.message,
//         error: err,
//       });
//     }
//     if (data) {
//       (req as any).authnRequest = {
//         relayState: req.query.RelayState || req.body.RelayState,
//         id: data.id,
//         issuer: data.issuer,
//         destination: data.destination,
//         acsUrl: data.assertionConsumerServiceURL,
//         forceAuthn: data.forceAuthn === "true",
//       };
//       console.log("Received AuthnRequest => \n", (req as any).authnRequest);
//     }
//     return res.render("user", {
//       user: req.user,
//       participant: req.participant,
//       metadata: req.metadata,
//       authnRequest: req.authnRequest,
//       idp: req.idp.options,
//       paths: IDP_PATHS,
//     });
//   });
// });

samlRouter.get(
  "/sso",
  samlp.auth({
    issuer: idpOptions.issuer,
    cert: idpOptions.cert,
    key: idpOptions.key,
    getPostURL: (audience, authnRequestDom, req, callback) => {
      return callback(null, "http://localhost:3000/login/callback");
    },
    getUserFromRequest: (req) => {
      // Here you should fetch the user from your database
      return {
        id: "122455623",
        name: "admin",
        emails: ["admin@test.com"],
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
  })
);

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
