const users = [
  // The id is email of user to match Salesforce username
  {
    id: "test@ngocoder.com",
    name: "Admin",
    email: "test@ngocoder.com",
    password: "test",
  },
];

const findUserByEmail = (email: string) => {
  return users.find((user) => user.email === email);
};

const findUserById = (id: string) => {
  return users.find((user) => user.id === id);
};

export const userRepo = {
  findUserByEmail,
  findUserById,
};
