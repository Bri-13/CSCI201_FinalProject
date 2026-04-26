// This file handles requests sent to /ratings:
	// GET  action=getRatingSummaryByRecipe : returns number of ratings a recipe_id has and its overall rating (avg of all ratings)


import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.json.JSONObject;

@WebServlet("/ratings")
public class RatingsServlet extends HttpServlet {

	private static final long serialVersionUID = 1L;

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
    	// GET COUNT : action=getRatingSummaryByRecipe --> returns number of ratings a recipe_id has and its overall rating (avg of all ratings)
    		// Response Structure:
 			//	{   "success": true,
 			//  	"recipe_id": 4,
 			//  	"rating_count": 17
			//  	"average_rating": 2.34	}
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        setCorsHeaders(response);
        JSONObject res = new JSONObject();

        try (Connection conn = DBConnection.getConnection()) {
            String action = request.getParameter("action");

            // check action parameters for specified data to GET:
            if ("getRatingSummaryByRecipe".equals(action)) {

			    int recipeId = Integer.parseInt(request.getParameter("recipe_id"));
				// call helper to summary object to return rating_count and average_rating
			    JSONObject summary = getRatingSummaryJson(conn, recipeId);
			
			    res.put("success", true);
			    res.put("recipe_id", recipeId);
			    res.put("rating_count", summary.getInt("rating_count"));
			    res.put("average_rating", summary.getDouble("average_rating"));
				
			} else {
			res.put("success", false);
			res.put("message", "Invalid action");
			}
        } catch (Exception e) {
            res.put("success", false);
            res.put("message", e.getMessage());
        }

        // send response back to browser
        response.getWriter().print(res.toString());
    }

    

    
    // *HELPER FUNCTION* : getRatingSummaryJson()
    // Sends statement to DB to request JSON obj of a specified recipeID's rating information 
		// Response Structure:
		//	{   "recipe_id": 4,
		//  	"rating_count": 179,
		//  	"average_rating": 2.34	}
    private JSONObject getRatingSummaryJson(Connection conn, int recipeId) throws Exception {
        
    	// request to DB for: rating_count, and average_rating
    	PreparedStatement stmt = conn.prepareStatement(
                "SELECT " +
                "COUNT(*) AS rating_count, " +
                "COALESCE(AVG(rating_value), 0) AS average_rating " +
                "FROM ratings WHERE recipe_id = ?");

        stmt.setInt(1, recipeId);
        ResultSet rs = stmt.executeQuery();

        JSONObject summary = new JSONObject();

        if (rs.next()) {
            summary.put("recipe_id", recipeId);
            summary.put("rating_count", rs.getInt("rating_count"));
            summary.put("average_rating", rs.getDouble("average_rating"));
        }

        return summary; // JSON obj of {String = "rating_info_name" : Object = data}
    }

    
   
}
