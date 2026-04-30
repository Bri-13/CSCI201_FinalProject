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

CREATE TABLE IF NOT EXISTS Recipes (
  recipe_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  recipe_name VARCHAR(255) NOT NULL,
  ingredients TEXT NOT NULL,
  instructions TEXT NOT NULL,
  prep_time INT NOT NULL,
  cook_time INT NOT NULL,
  difficulty VARCHAR(50),
  category VARCHAR(100),
  photo_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ModifiedRecipes (
  modified_recipe_id INT AUTO_INCREMENT PRIMARY KEY,
  original_recipe_id INT NOT NULL,
  user_id INT NOT NULL,
  recipe_name VARCHAR(255) NOT NULL,
  ingredients TEXT NOT NULL,
  instructions TEXT NOT NULL,
  prep_time INT,
  cook_time INT,
  difficulty VARCHAR(50),
  category VARCHAR(100),
  photo_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (original_recipe_id) REFERENCES Recipes(recipe_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS comments (
    comment_id INT AUTO_INCREMENT PRIMARY KEY, -- unique ID for each comment
    recipe_id INT NOT NULL, -- recipe_id for which comment belongs to
    user_id INT NOT NULL, -- user_id of who wrote the comment
    comment_text TEXT NOT NULL, -- text conetent of the comment
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_comment_card UNIQUE (recipe_id, user_id) -- constrain to ONE COMMENT CARD PER USER AND RECIPE PAIR
);

CREATE TABLE IF NOT EXISTS ratings (
    rating_id INT AUTO_INCREMENT PRIMARY KEY, -- unique ID for each rating
    recipe_id INT NOT NULL, -- recipe_id of which rating belongs to
    user_id INT NOT NULL, -- user_id of who gave the rating
    rating_value INT NOT NULL, -- rating value between 1-5 stars 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_rating_value CHECK (rating_value BETWEEN 1 AND 5), -- constrain to only store valid ratings of between 1-5 stars
    CONSTRAINT uq_recipe_user_rating UNIQUE (recipe_id, user_id) -- constrain users to only have one rating per recipe
);

CREATE TABLE IF NOT EXISTS SavedRecipes (
    saved_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    recipe_id INT NOT NULL,
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_recipe UNIQUE (user_id, recipe_id),
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES Recipes(recipe_id) ON DELETE CASCADE
);

CREATE INDEX idx_comments_recipe_id ON comments(recipe_id); -- index to load all comments for a recipe with recipe_id
CREATE INDEX idx_ratings_recipe_id ON ratings(recipe_id); -- index to load all ratings for a recipe with recipe_id

3. Configure Database Connection
go to: backend/src/DBConnection.java
then update:
String user = "root";
String password = "YOUR_PASSWORD";

4. Add Required JARs to Tomcat

Place the following files in:
apache-tomcat-10.x/lib/

- mysql-connector-j-*.jar
- json-*.jar

5. Compile Backend
cd backend/src
javac -cp ".:/PATH_TO_TOMCAT/lib/*:/PATH_TO_JSON_JAR" *.java

6. Deploy to Tomcat
cd ..
mkdir -p AuthApp/WEB-INF/classes
mv src/*.class AuthApp/WEB-INF/classes/
cp -r AuthApp /path-to-tomcat/webapps/

7. Restart Tomcat

cd /path-to-tomcat/bin
./shutdown.sh
./startup.sh

8. Test Backend
curl -X POST http://localhost:8080/AuthApp/AuthServlet \
-H "Content-Type: application/json" \
-d '{"action":"signup","username":"testuser","email":"test@example.com","password":"1234"}'

Note:
After making changes to backend code, you must:
1. Recompile
2. Copy `.class` files to Tomcat
3. Restart Tomcat

Otherwise, changes will not take effect.


## Backend Dependencies

This project uses Java Servlets, so dependencies are managed via `.jar` files rather than `npm`.
Required libraries must be placed in the Tomcat `/lib` directory.

To connect the mobile app to your local backend, update the BASE_URL in:
home.js
login.js
signup.js

1. Get your local IP address
Mac: ipconfig getifaddr en0
Windows: ipconfig

Then replace BASE_URL:
http://YOUR_IP:8080/AuthApp/

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
