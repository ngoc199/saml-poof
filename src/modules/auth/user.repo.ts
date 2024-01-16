const users = [
  { id: "123123", name: "Admin", email: "admin@test.com", password: "admin" },
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
