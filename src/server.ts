import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "node:path";
import session from "express-session";
import passport from "passport";
import hbs from "hbs";
import { Strategy as LocalStrategy } from "passport-local";
import { samlRouter } from "./modules/saml/saml.router";
import { userIsAuthenticated } from "./middlewares/user-is-authenticated";
import { userRepo } from "./modules/auth/user.repo";

const app = express();

// Security
app.use(cors());
app.use(helmet());

// Session
app.use(
  session({
    // the name must be set due to the service provider has the same domain 'localhost'
    name: "unique.sid",
    secret: "supersecret",
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      httpOnly: true,
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((user, done) => {
  done(null, user as any);
});

// Body parser
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// View
app.set("view engine", "hbs");
app.engine("handlebars", hbs.__express);
const VIEW_PATH = path.join(__dirname, "../views");
app.set("views", VIEW_PATH);

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    (username, password, done) => {
      const user = userRepo.findUserByEmail(username);
      if (!user || user.password !== password) {
        return done(null, false);
      }
      return done(null, { id: user.id });
    }
  )
);

app.use("/saml", samlRouter);
app.get("/", (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect("/authenticated");
  }
  return res.redirect("/login");
});
app.get("/login", (req, res) => {
  res.render("login");
});
app.post(
  "/login",
  passport.authenticate("local", { failureRedirect: "/login" }),
  (req, res) => {
    if (req.query.return_to) {
      return res.redirect(req.query.return_to as string);
    }
    return res.redirect("/authenticated");
  }
);
app.post("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error(err);
      return res.sendStatus(500);
    }
    return res.redirect("/");
  });
});
app.get("/authenticated", userIsAuthenticated, (req, res) => {
  res.render("authenticated", { user: req.user });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
