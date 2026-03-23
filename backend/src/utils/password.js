import bcrypt from 'bcrypt';

const password = "Superadmin@123"; // change this to your password
const saltRounds = 10;

bcrypt.hash(password, saltRounds, function(err, hash) {
    if (err) {
        console.error(err);
        return;
    }
    console.log("Hashed Password:", hash);
});