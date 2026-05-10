import java.io.BufferedReader;
import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

import org.json.JSONArray;
import org.json.JSONObject;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@WebServlet("/SavedRecipeServlet")
public class SavedRecipeServlet extends HttpServlet {

    protected void doOptions(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        setCorsHeaders(response);
        response.setStatus(HttpServletResponse.SC_OK);
    }

    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        setCorsHeaders(response);
        JSONObject res = new JSONObject();

        try (Connection conn = DBConnection.getConnection()) {
            String action = request.getParameter("action");

            if ("getSavedRecipes".equals(action)) {
                int userId = Integer.parseInt(request.getParameter("user_id"));
                PreparedStatement stmt = conn.prepareStatement(
                        "SELECT r.*, s.saved_id, s.saved_at "
                                + "FROM SavedRecipes s "
                                + "JOIN Recipes r ON s.recipe_id = r.recipe_id "
                                + "WHERE s.user_id = ? ORDER BY s.saved_at DESC");
                stmt.setInt(1, userId);
                ResultSet rs = stmt.executeQuery();
                JSONArray recipes = new JSONArray();

                while (rs.next()) {
                    JSONObject recipe = recipeResultToJson(rs);
                    recipe.put("saved_id", rs.getInt("saved_id"));
                    recipe.put("saved_at", rs.getTimestamp("saved_at").toString());
                    recipes.put(recipe);
                }

                res.put("success", true);
                res.put("recipes", recipes);

            } else if ("getSavedRecipeIds".equals(action)) {
                int userId = Integer.parseInt(request.getParameter("user_id"));
                PreparedStatement stmt = conn.prepareStatement(
                        "SELECT recipe_id FROM SavedRecipes WHERE user_id = ? ORDER BY saved_at DESC");
                stmt.setInt(1, userId);
                ResultSet rs = stmt.executeQuery();
                JSONArray recipeIds = new JSONArray();

                while (rs.next()) {
                    recipeIds.put(rs.getInt("recipe_id"));
                }

                res.put("success", true);
                res.put("recipe_ids", recipeIds);

            } else if ("isRecipeSaved".equals(action)) {
                int userId = Integer.parseInt(request.getParameter("user_id"));
                int recipeId = Integer.parseInt(request.getParameter("recipe_id"));
                res.put("success", true);
                res.put("saved", isRecipeSaved(conn, userId, recipeId));

            } else {
                res.put("success", false);
                res.put("message", "Invalid action");
            }

        } catch (Exception e) {
            res.put("success", false);
            res.put("message", e.getMessage());
        }

        response.getWriter().print(res.toString());
    }

    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        setCorsHeaders(response);
        JSONObject res = new JSONObject();

        try {
            JSONObject req = readJsonBody(request);
            String action = req.optString("action", "");

            try (Connection conn = DBConnection.getConnection()) {
                if ("saveRecipe".equals(action)) {
                    int userId = req.optInt("user_id", -1);
                    int recipeId = req.optInt("recipe_id", -1);

                    String validation = validateUserAndRecipeIds(userId, recipeId);
                    if (validation != null) {
                        res.put("success", false);
                        res.put("message", validation);
                        response.getWriter().print(res.toString());
                        return;
                    }

                    if (!userExists(conn, userId)) {
                        res.put("success", false);
                        res.put("message", "User not found");
                        response.getWriter().print(res.toString());
                        return;
                    }

                    if (!recipeExists(conn, recipeId)) {
                        res.put("success", false);
                        res.put("message", "Recipe not found");
                        response.getWriter().print(res.toString());
                        return;
                    }

                    if (isRecipeSaved(conn, userId, recipeId)) {
                        res.put("success", false);
                        res.put("message", "Recipe already saved");
                        response.getWriter().print(res.toString());
                        return;
                    }

                    PreparedStatement stmt = conn.prepareStatement(
                            "INSERT INTO SavedRecipes (user_id, recipe_id) VALUES (?, ?)",
                            Statement.RETURN_GENERATED_KEYS);
                    stmt.setInt(1, userId);
                    stmt.setInt(2, recipeId);
                    stmt.executeUpdate();

                    ResultSet keys = stmt.getGeneratedKeys();
                    if (keys.next()) {
                        res.put("saved_id", keys.getInt(1));
                    }
                    res.put("success", true);
                    res.put("saved", true);
                    res.put("message", "Recipe saved successfully");

                } else if ("unsaveRecipe".equals(action)) {
                    int userId = req.optInt("user_id", -1);
                    int recipeId = req.optInt("recipe_id", -1);

                    String validation = validateUserAndRecipeIds(userId, recipeId);
                    if (validation != null) {
                        res.put("success", false);
                        res.put("message", validation);
                        response.getWriter().print(res.toString());
                        return;
                    }

                    PreparedStatement stmt = conn.prepareStatement(
                            "DELETE FROM SavedRecipes WHERE user_id = ? AND recipe_id = ?");
                    stmt.setInt(1, userId);
                    stmt.setInt(2, recipeId);
                    int rows = stmt.executeUpdate();

                    if (rows == 0) {
                        res.put("success", false);
                        res.put("message", "Recipe was not saved");
                    } else {
                        res.put("success", true);
                        res.put("saved", false);
                        res.put("message", "Recipe removed from saved recipes");
                    }

                } else if ("toggleSaveRecipe".equals(action)) {
                    int userId = req.optInt("user_id", -1);
                    int recipeId = req.optInt("recipe_id", -1);

                    String validation = validateUserAndRecipeIds(userId, recipeId);
                    if (validation != null) {
                        res.put("success", false);
                        res.put("message", validation);
                        response.getWriter().print(res.toString());
                        return;
                    }

                    if (!userExists(conn, userId)) {
                        res.put("success", false);
                        res.put("message", "User not found");
                        response.getWriter().print(res.toString());
                        return;
                    }

                    if (!recipeExists(conn, recipeId)) {
                        res.put("success", false);
                        res.put("message", "Recipe not found");
                        response.getWriter().print(res.toString());
                        return;
                    }

                    if (isRecipeSaved(conn, userId, recipeId)) {
                        PreparedStatement stmt = conn.prepareStatement(
                                "DELETE FROM SavedRecipes WHERE user_id = ? AND recipe_id = ?");
                        stmt.setInt(1, userId);
                        stmt.setInt(2, recipeId);
                        stmt.executeUpdate();
                        res.put("success", true);
                        res.put("saved", false);
                        res.put("message", "Recipe removed from saved recipes");
                    } else {
                        PreparedStatement stmt = conn.prepareStatement(
                                "INSERT INTO SavedRecipes (user_id, recipe_id) VALUES (?, ?)");
                        stmt.setInt(1, userId);
                        stmt.setInt(2, recipeId);
                        stmt.executeUpdate();
                        res.put("success", true);
                        res.put("saved", true);
                        res.put("message", "Recipe saved successfully");
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

    private void setCorsHeaders(HttpServletResponse response) {
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type");
        response.setContentType("application/json");
    }

    private JSONObject readJsonBody(HttpServletRequest request) throws Exception {
        StringBuilder sb = new StringBuilder();
        BufferedReader reader = request.getReader();
        String line;

        while ((line = reader.readLine()) != null) {
            sb.append(line);
        }

        if (sb.length() == 0) {
            throw new Exception("Empty request");
        }

        return new JSONObject(sb.toString());
    }

    private String validateUserAndRecipeIds(int userId, int recipeId) {
        if (userId <= 0) {
            return "Valid user_id is required";
        }
        if (recipeId <= 0) {
            return "Valid recipe_id is required";
        }
        return null;
    }

    private boolean userExists(Connection conn, int userId) throws SQLException {
        PreparedStatement stmt = conn.prepareStatement(
                "SELECT 1 FROM Users WHERE user_id = ?");
        stmt.setInt(1, userId);
        ResultSet rs = stmt.executeQuery();
        return rs.next();
    }

    private boolean recipeExists(Connection conn, int recipeId) throws SQLException {
        PreparedStatement stmt = conn.prepareStatement(
                "SELECT 1 FROM Recipes WHERE recipe_id = ?");
        stmt.setInt(1, recipeId);
        ResultSet rs = stmt.executeQuery();
        return rs.next();
    }

    private boolean isRecipeSaved(Connection conn, int userId, int recipeId) throws SQLException {
        PreparedStatement stmt = conn.prepareStatement(
                "SELECT 1 FROM SavedRecipes WHERE user_id = ? AND recipe_id = ?");
        stmt.setInt(1, userId);
        stmt.setInt(2, recipeId);
        ResultSet rs = stmt.executeQuery();
        return rs.next();
    }

    private JSONObject recipeResultToJson(ResultSet rs) throws SQLException {
        JSONObject recipe = new JSONObject();
        recipe.put("recipe_id", rs.getInt("recipe_id"));
        recipe.put("user_id", rs.getInt("user_id"));
        recipe.put("recipe_name", rs.getString("recipe_name"));
        recipe.put("ingredients", rs.getString("ingredients"));
        recipe.put("instructions", rs.getString("instructions"));
        recipe.put("prep_time", rs.getInt("prep_time"));
        recipe.put("cook_time", rs.getInt("cook_time"));
        recipe.put("difficulty", rs.getString("difficulty"));
        recipe.put("category", rs.getString("category"));
        recipe.put("photo_url", rs.getString("photo_url"));
        recipe.put("created_at", rs.getTimestamp("created_at").toString());
        return recipe;
    }
}
