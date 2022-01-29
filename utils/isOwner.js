const isOwner = async (collection, userId, id) => {
  try {
    const singleCollection = await collection.findOne({ id });

    if(!singleCollection) return strapi.errors.badRequest('A record with that id was not found');

    if(!singleCollection.user?.id) return strapi.errors.badRequest('This collection does not have a user id');

    if(userId === singleCollection.user.id){
      return true;
    }

    return false;
  } catch(err) {
    strapi.errors.badRequest(err);
    return false;
  }
};

module.exports = isOwner;