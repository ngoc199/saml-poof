import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "node:path";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { userIsAuthenticated } from "./middlewares/user-is-authenticated";

const app = express();

// Security
app.use(cors());
app.use(helmet());

// Session
app.use(
  session({
    secret: "supersecret",
    resave: false,
    saveUninitialized: true,
    cookie: {
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
const VIEW_PATH = path.join(__dirname, "views");
app.set("views", VIEW_PATH);

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    (username, password, done) => {
      if (username === "admin@test.com" && password === "admin") {
        return done(null, { username });
      } else {
        return done(null, false);
      }
    }
  )
);

app.get("/login", (_IGNORE, res) => {
  res.render("login");
});
app.post(
  "/login",
  passport.authenticate("local", { failureRedirect: "/login" }),
  (_IGNORE, res) => {
    res.redirect("/authenticated");
  }
);
app.get("/authenticated", userIsAuthenticated, (req, res) => {
  res.render("authenticated", { user: req.user });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
