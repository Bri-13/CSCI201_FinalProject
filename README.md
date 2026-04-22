# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Backend Setup
1. Install Requirements
- Java JDK (17+ recommended)
- MySQL
- Apache Tomcat (10.x)

2. Set up MySQL Database
Run the following in MySQL Workbench:
CREATE DATABASE auth_db;

USE auth_db;

CREATE TABLE Users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50),
  email VARCHAR(100) UNIQUE,
  password VARCHAR(255)
);

3. Configure Database Connection
go to: backend/src/DBConnection.java
then update:
String user = "root";
String password = "YOUR_PASSWORD";

4. Add Required JARs to Tomcat
apache-tomcat-10.x/lib/

5. Compile Backend
cd backend/src
javac -cp ".:/path-to-tomcat/lib/*" *.java

6. Start Tomcat
cd /path-to-tomcat/bin
./startup.sh

7. Test Backend
curl -X POST http://localhost:8080/AuthApp/AuthServlet \
-H "Content-Type: application/json" \
-d '{"action":"signup","username":"testuser","email":"test@example.com","password":"1234"}'


## Backend Dependencies

This project uses Java Servlets, so dependencies are managed via `.jar` files rather than `npm`.
Required libraries must be placed in the Tomcat `/lib` directory.

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
