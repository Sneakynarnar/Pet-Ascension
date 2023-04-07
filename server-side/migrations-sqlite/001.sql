CREATE TABLE Accounts (
  id CHAR(23) PRIMARY KEY,
  NP integer,
  items CHAR(300)
)
CREATE TABLE Pets (
  accountId CHAR(23)
  petName CHAR(20)
  petData CHAR(1000)
  PRIMARY KEY (accountId, petName)

)