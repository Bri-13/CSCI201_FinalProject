// This file handles requests sent to /comments:
	// GET action=getCommentCardsByRecipe : return all Comment Cards of recipeID
	// GET action=getUserCommentByRecipe : return the userID's comment on recipeID
	// GET action=getCommentCount : return comment count
	// POST action=addCommentCard
	// POST action=updateCommentCard
	// POST action=deleteCommentCard


import java.io.*;
import java.sql.*;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import jakarta.servlet.annotation.WebServlet;

import org.json.JSONArray;
import org.json.JSONObject;

@WebServlet("/comments")
public class CommentsServlet extends HttpServlet {

	// Method to let .js call the servlet and tell browser response is JSON
    private void setCorsHeaders(HttpServletResponse response) {
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type");
        response.setContentType("application/json");
    }

    // Method to handle browser preflight requests for CORS --> for frontend to send JSON using fetch: 
    protected void doOptions(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        setCorsHeaders(response);
        response.setStatus(HttpServletResponse.SC_OK);
    }

    
    
	// DOGET METHOD: check action parameter of HTTP request for:
	    // GET  action=getCommentCardsByRecipe --> return all comments on recipeID
			// Response Structure:
			//	{   "success": true,
    		//		"message": message, 
    		//		"comments": {
    		//			"comment_id": 12,
			//  		"recipe_id": 4,
			//  		"user_id": 7,
			//  		"username": "foodlover99",
			//  		"avatar": "F",
			//  		"comment_text": "Loved this recipe!",
			//  		"created_at": "2026-04-25 13:30:00",
			//  		"updated_at": "2026-04-25 13:30:00",
			//  		"rating_value": 5  }	}
	 	// GET  action=getUserCommentByRecipe --> return the userID's comment card on recipeID
    		// takes recipe_id and user_id
	    	// Response Structure:
			//	{   "success": true,
			//  	"message": "Comment card saved successfully",
			//  	"comment_card": Comment Card JSON	}
	 	// GET  action=getCommentCount --> return number of comment cards on recipeID
		    // Response Structure:
		    //	{	"success": true,
		    //      "recipe_id": 4,
		    //      "comment_count": 18		}
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        setCorsHeaders(response);
        JSONObject res = new JSONObject();

        try (Connection conn = DBConnection.getConnection()) {
            String action = request.getParameter("action");

            // check action parameters for specified data to GET:
            if ("getCommentCardsByRecipe".equals(action)) { // GET  action=getCommentCardsByRecipe
                int recipeId = Integer.parseInt(request.getParameter("recipe_id"));

                PreparedStatement stmt = conn.prepareStatement(
                        "SELECT " +
                        "c.comment_id, " +
                        "c.recipe_id, " +
                        "c.user_id, " +
                        "u.username, " +
                        "c.comment_text, " +
                        "c.created_at, " +
                        "c.updated_at, " +
                        "r.rating_value " +
                        "FROM social_db.comments c " +
                        "JOIN auth_db.Users u ON c.user_id = u.user_id " +
                        "LEFT JOIN social_db.ratings r ON c.recipe_id = r.recipe_id AND c.user_id = r.user_id " +
                        "WHERE c.recipe_id = ? " +
                        "ORDER BY c.created_at DESC");
                stmt.setInt(1, recipeId);

                ResultSet rs = stmt.executeQuery();
                JSONArray comments = new JSONArray();

                while (rs.next()) {
                    comments.put(commentResultToJson(rs));
                }

                res.put("success", true);
                res.put("comments", comments);

            } else if ("getUserCommentByRecipe".equals(action)) { // GET action=getUserCommentByRecipe
                int recipeId = Integer.parseInt(request.getParameter("recipe_id"));
                int userId = Integer.parseInt(request.getParameter("user_id"));

                // call helper to get user's comment card json
                JSONObject commentCard = getUserCommentCardJson(conn, recipeId, userId);

                res.put("success", true);
                res.put("comment_card", commentCard == null ? JSONObject.NULL : commentCard);

            } else if ("getCommentCount".equals(action)) { // GET  action=getCommentCount
                int recipeId = Integer.parseInt(request.getParameter("recipe_id"));

                PreparedStatement stmt = conn.prepareStatement(
                        "SELECT COUNT(*) AS comment_count FROM comments WHERE recipe_id = ?");
                stmt.setInt(1, recipeId);

                ResultSet rs = stmt.executeQuery();

                int count = 0;
                if (rs.next()) {
                    count = rs.getInt("comment_count");
                }

                res.put("success", true);
                res.put("recipe_id", recipeId);
                res.put("comment_count", count);

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

    
 
    
    
	// DOPOST METHOD: check action parameter of HTTP request for:
	    // POST ADD: action=addCommentCard --> add userID's comment card to recipeID
    		// Response Structure:
 			//	{   "success": true,
 			//  	"message": "Comment card saved successfully",
 			//  	"comment_card": Comment Card JSON	}
	 	// POST EDIT: action=updateCommentCard --> update userID's comment card on recipeID
	    	// Response Structure:
			//	{   "success": true,
			//  	"message": "Comment card saved successfully",
			//  	"comment_card": Comment Card JSON	}
	 	// POST DELETE: action=deleteCommentCard --> delete userID's comment card on recipeID
		    // Response Structure:
			//	{   "success": true,
	    	//		"message": "Comment card deleted successfully"	}
    // post operations need: recipe_id, user_id, comment_txt, rating_value
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        setCorsHeaders(response);
        JSONObject res = new JSONObject();

        try {
            JSONObject req = readJsonBody(request);
            String action = req.optString("action", "");

            try (Connection conn = DBConnection.getConnection()) {

            	// check action parameters for specified data to POST:
            	 if ("addCommentCard".equals(action)) {
            		// POST action=addCommentCard --> add userID's comment card to recipeID
                     int recipeId = req.optInt("recipe_id", -1);
                     int userId = req.optInt("user_id", -1);
                     String commentText = req.optString("comment_text", "").trim();
                     int ratingValue = req.optInt("rating_value", -1);

                     String validation = validateCommentCardInput(req, true);
                     if (validation != null) {
                         res.put("success", false);
                         res.put("message", validation);
                         response.getWriter().print(res.toString());
                         return;
                     }

                     PreparedStatement commentStmt = conn.prepareStatement(
                             "INSERT INTO comments (recipe_id, user_id, comment_text) VALUES (?, ?, ?) " +
                             "ON DUPLICATE KEY UPDATE " +
                             "comment_text = VALUES(comment_text), " +
                             "updated_at = CURRENT_TIMESTAMP");

                     commentStmt.setInt(1, recipeId);
                     commentStmt.setInt(2, userId);
                     commentStmt.setString(3, commentText);
                     commentStmt.executeUpdate();

                     if (ratingValue != -1) {
                         PreparedStatement ratingStmt = conn.prepareStatement(
                                 "INSERT INTO ratings (recipe_id, user_id, rating_value) VALUES (?, ?, ?) " +
                                 "ON DUPLICATE KEY UPDATE " +
                                 "rating_value = VALUES(rating_value), " +
                                 "updated_at = CURRENT_TIMESTAMP");

                         ratingStmt.setInt(1, recipeId);
                         ratingStmt.setInt(2, userId);
                         ratingStmt.setInt(3, ratingValue);
                         ratingStmt.executeUpdate();
                     }

                     JSONObject commentCard = getUserCommentCardJson(conn, recipeId, userId);

                     res.put("success", true);
                     res.put("message", "Comment card saved successfully");
                     res.put("comment_card", commentCard);

                 } else if ("updateCommentCard".equals(action)) {
                	// POST action=updateCommentCard --> update userID's comment card on recipeID
                     int recipeId = req.optInt("recipe_id", -1);
                     int userId = req.optInt("user_id", -1);
                     String commentText = req.optString("comment_text", "").trim();
                     int ratingValue = req.optInt("rating_value", -1);

                     String validation = validateCommentCardInput(req, true);
                     if (validation != null) {
                         res.put("success", false);
                         res.put("message", validation);
                         response.getWriter().print(res.toString());
                         return;
                     }

                     PreparedStatement commentStmt = conn.prepareStatement(
                             "UPDATE comments " +
                             "SET comment_text = ?, updated_at = CURRENT_TIMESTAMP " +
                             "WHERE recipe_id = ? AND user_id = ?");

                     commentStmt.setString(1, commentText);
                     commentStmt.setInt(2, recipeId);
                     commentStmt.setInt(3, userId);

                     int rowsUpdated = commentStmt.executeUpdate();

                     if (rowsUpdated == 0) {
                         res.put("success", false);
                         res.put("message", "Comment card not found or user not authorized");
                         response.getWriter().print(res.toString());
                         return;
                     }

                     if (ratingValue != -1) {
                         PreparedStatement ratingStmt = conn.prepareStatement(
                                 "INSERT INTO ratings (recipe_id, user_id, rating_value) VALUES (?, ?, ?) " +
                                 "ON DUPLICATE KEY UPDATE " +
                                 "rating_value = VALUES(rating_value), " +
                                 "updated_at = CURRENT_TIMESTAMP");

                         ratingStmt.setInt(1, recipeId);
                         ratingStmt.setInt(2, userId);
                         ratingStmt.setInt(3, ratingValue);
                         ratingStmt.executeUpdate();
                     }

                     JSONObject commentCard = getUserCommentCardJson(conn, recipeId, userId);

                     res.put("success", true);
                     res.put("message", "Comment card updated successfully");
                     res.put("comment_card", commentCard);

                 } else if ("deleteCommentCard".equals(action)) {
                	// POST action=deleteCommentCard --> delete userID's comment card on recipeID
                     int recipeId = req.optInt("recipe_id", -1);
                     int userId = req.optInt("user_id", -1);

                     if (recipeId <= 0 || userId <= 0) {
                         res.put("success", false);
                         res.put("message", "Missing recipe_id or user_id");
                         response.getWriter().print(res.toString());
                         return;
                     }

                     PreparedStatement commentStmt = conn.prepareStatement(
                             "DELETE FROM comments WHERE recipe_id = ? AND user_id = ?");
                     commentStmt.setInt(1, recipeId);
                     commentStmt.setInt(2, userId);

                     int rowsDeleted = commentStmt.executeUpdate();

                     PreparedStatement ratingStmt = conn.prepareStatement(
                             "DELETE FROM ratings WHERE recipe_id = ? AND user_id = ?");
                     ratingStmt.setInt(1, recipeId);
                     ratingStmt.setInt(2, userId);
                     ratingStmt.executeUpdate();

                     if (rowsDeleted > 0) {
                         res.put("success", true);
                         res.put("message", "Comment card deleted successfully");
                     } else {
                         res.put("success", false);
                         res.put("message", "Comment card not found or user not authorized");
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
    
    
    
    
    // HELPER FUNCTION: getUserCommentCardJson()
    // Accesses social DB for all information needed for the comment card
    // return JSON obj of comment card
    private JSONObject getUserCommentCardJson(Connection conn, int recipeId, int userId) throws Exception {
        PreparedStatement stmt = conn.prepareStatement(
                "SELECT " +
                "c.comment_id, " +
                "c.recipe_id, " +
                "c.user_id, " +
                "u.username, " +
                "c.comment_text, " +
                "c.created_at, " +
                "c.updated_at, " +
                "r.rating_value " +
                "FROM social_db.comments c " +
                "JOIN auth_db.Users u ON c.user_id = u.user_id " +
                "LEFT JOIN social_db.ratings r ON c.recipe_id = r.recipe_id AND c.user_id = r.user_id " +
                "WHERE c.recipe_id = ? AND c.user_id = ?");

        stmt.setInt(1, recipeId);
        stmt.setInt(2, userId);

        ResultSet rs = stmt.executeQuery();

        if (rs.next()) {
            return commentResultToJson(rs);
        }

        return null;
    }
    

    
    
    // HELPER FUNCTION: validateCommentCardInput() 
    // validate all parameters/fields before accessing SQL
    // prevent invalid requests: missing/invalid userID, recipeID, comment_text, rating_value
	private String validateCommentCardInput(JSONObject req, boolean requireText) {
        
		int recipeId = req.optInt("recipe_id", -1);
        int userId = req.optInt("user_id", -1);
        String commentText = req.optString("comment_text", "").trim();
        int ratingValue = req.optInt("rating_value", -1);

        if (recipeId <= 0) {
            return "Valid recipe_id is required";
        }

        if (userId <= 0) {
            return "Valid user_id is required";
        }

        if (requireText && commentText.isEmpty()) {
            return "comment_text is required";
        }

        // Only validate rating if it is provided
        if (ratingValue != -1 && (ratingValue < 1 || ratingValue > 5)) {
            return "rating_value must be between 1 and 5";
        }

        return null;
    }
    
    
    
    
    // HELPER FUNCTION: readJsonBody() 
    // reads the request body and converts to JSONObject
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

    
    
    // HELPER FUNCTION: commentResultToJson()
    // called by GET for getCommentByRecipe action
    // turns the requested comment info from social DB into JSON for the response to send back to browser
    private JSONObject commentResultToJson(ResultSet rs) throws Exception {
        JSONObject comment = new JSONObject();

        String username = rs.getString("username");

        comment.put("comment_id", rs.getInt("comment_id"));
        comment.put("recipe_id", rs.getInt("recipe_id"));
        comment.put("user_id", rs.getInt("user_id"));
        comment.put("username", username);
        comment.put("avatar", username == null || username.isEmpty()
                ? "?"
                : username.substring(0, 1).toUpperCase());
        comment.put("comment_text", rs.getString("comment_text"));
        comment.put("created_at", String.valueOf(rs.getTimestamp("created_at")));
        comment.put("updated_at", String.valueOf(rs.getTimestamp("updated_at")));

        int ratingValue = rs.getInt("rating_value");
        if (rs.wasNull()) {
            comment.put("rating_value", JSONObject.NULL);
        } else {
            comment.put("rating_value", ratingValue);
        }

        return comment;
    }
}
