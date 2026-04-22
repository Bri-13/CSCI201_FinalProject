import java.sql.Connection;
import java.sql.DriverManager;

public class DBConnection {

    public static Connection getConnection() throws Exception {
        String url = "jdbc:mysql://localhost:3306/auth_db";
        String user = "root";
        String password = "csci201_final";

        Class.forName("com.mysql.cj.jdbc.Driver");

        return DriverManager.getConnection(url, user, password);
    }
}