const Listing = require("../models/listing");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });



module.exports.index = async (req, res) =>{
      const allListings = await Listing.find({});
     res.render("listings/index.ejs", {allListings});
 };

 module.exports.renderNewForm =  (req,res) =>{
     res.render("listings/new.ejs");
 };

 module.exports.showListing =async (req, res) => {
     let { id } = req.params;
     const listing = await Listing.findById(id).populate({ path:"reviews", 
         populate:{
             path: "author",
     },
 })
 .populate("owner");
     if(!listing) {
         req.flash("error", "Listing you requested for does not exist");
          return res.redirect("/listings");
     }
     console.log(listing);
     res.render("listings/show.ejs", { listing });
  };


// module.exports.createListing = async (req,res,next) =>{
//     let url = req.file.path;
//     let filename = req.file.filename;
//         const newListing = new Listing(req.body.listing);
//          newListing.owner = req.user._id;
//          newListing.image = {url, filename};
//          await newListing.save();
//         req.flash("success", "New Listing Created");
//         res.redirect("/listings");
//      };

module.exports.createListing = async (req, res, next) => {
   let response = await geocodingClient
   .forwardGeocode({
  query: req.body.listing.location,
  limit: 1,
})
.send();


    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;

    newListing.geometry = response.body.features[0].geometry;

    // ✅ Handle image properly
    if (req.file) {
        newListing.image = {
            url: req.file.path,
            filename: req.file.filename
        };
    } else {
        // Set a default placeholder image
        newListing.image = {
            url: "https://via.placeholder.com/400x300?text=No+Image",
            filename: "default-image"
        };
    }

     let savedListing = await newListing.save();
     console.log(savedListing);
    req.flash("success", "New Listing Created");
    res.redirect("/listings");
};


module.exports.renderEditForm = async(req,res) =>{
    let {id} = req.params;
      const listing = await Listing.findById(id);
       if(!listing) {
         req.flash("error", "Listing you requested for does not exist");
          return res.redirect("/listings");
     }

     let originalImageUrl = listing.image.url;
     originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");

      res.render("listings/edit.ejs", {listing, originalImageUrl});
 };

// module.exports.updateListing = async(req,res) =>{
//      let {id} = req.params;
//      await Listing.findByIdAndUpdate(id,{... req.body.listing});
//      req.flash("success", "Listing Updated");
//      res.redirect(`/listings/${id}`);
//  };

module.exports.updateListing = async (req, res) => {
  const { id } = req.params;
  
  // Find the listing first
  const listing = await Listing.findById(id);

  // Update the text fields from req.body.listing
  Object.assign(listing, req.body.listing);

  // If a new image file is uploaded, update the image field
  if (  req.file ) {
    listing.image = {
      url: req.file.path,
      filename: req.file.filename,
    };
  }

  // Save the updated listing
  await listing.save();

  req.flash("success", "Listing Updated");
  res.redirect(`/listings/${id}`);
};


module.exports.destroyListing = async(req,res) =>{
     let {id} =req.params;
     let deleteListing = await Listing.findByIdAndDelete(id);
     console.log(deleteListing);
  req.flash("success", " Listing Deleted");
     res.redirect("/listings");
 };