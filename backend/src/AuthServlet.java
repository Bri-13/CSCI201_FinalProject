import java.io.*;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import jakarta.servlet.annotation.WebServlet;
import java.sql.*;
import org.json.JSONObject;

@WebServlet("/AuthServlet")
public class AuthServlet extends HttpServlet {

    protected void doOptions(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type");
        response.setStatus(HttpServletResponse.SC_OK);
    }

    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type");

        response.setContentType("application/json");
        JSONObject res = new JSONObject();

        try {
            StringBuilder sb = new StringBuilder();
            BufferedReader reader = request.getReader();
            String line;

            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }

            if (sb.length() == 0) {
                res.put("success", false);
                res.put("message", "Empty request");
                response.getWriter().print(res.toString());
                return;
            }

            JSONObject req = new JSONObject(sb.toString());
            String action = req.optString("action", "");

            try (Connection conn = DBConnection.getConnection()) {

                if ("signup".equals(action)) {

                    String username = req.optString("username", "");
                    String email = req.optString("email", "");
                    String password = req.optString("password", "");

                    if (username.isEmpty() || email.isEmpty() || password.isEmpty()) {
                        res.put("success", false);
                        res.put("message", "Missing fields");
                        response.getWriter().print(res.toString());
                        return;
                    }

                    PreparedStatement check = conn.prepareStatement(
                            "SELECT * FROM Users WHERE email=?");
                    check.setString(1, email);
                    ResultSet rs = check.executeQuery();

                    if (rs.next()) {
                        res.put("success", false);
                        res.put("message", "Email already exists");
                    } else {
                        PreparedStatement stmt = conn.prepareStatement(
                                "INSERT INTO Users(username, email, password) VALUES (?, ?, ?)");
                        stmt.setString(1, username);
                        stmt.setString(2, email);
                        stmt.setString(3, password);
                        stmt.executeUpdate();

                        res.put("success", true);
                    }

                } else if ("login".equals(action)) {

                    String email = req.optString("email", "");
                    String password = req.optString("password", "");

                    if (email.isEmpty() || password.isEmpty()) {
                        res.put("success", false);
                        res.put("message", "Missing email or password");
                        response.getWriter().print(res.toString());
                        return;
                    }

                    PreparedStatement stmt = conn.prepareStatement(
                            "SELECT * FROM Users WHERE email=? AND password=?");
                    stmt.setString(1, email);
                    stmt.setString(2, password);

                    ResultSet rs = stmt.executeQuery();

                    if (rs.next()) {
                        res.put("success", true);
                        res.put("username", rs.getString("username"));
                    } else {
                        res.put("success", false);
                        res.put("message", "Invalid credentials");
                    }

                } else {
                    res.put("success", false);
                    res.put("message", "Invalid action");
                }

            }

        } catch (Exception e) {
            res.put("success", false);
            res.put("message", e.getMessage());
        }

        response.getWriter().print(res.toString());
    }
}