const isOwner = async (collection, userId, id) => {
  try {
    const singleCollection = await collection.findOne({ id });

    if(!singleCollection) throw strapi.errors.badRequest('A record with that id was not found');

    if(!singleCollection.user?.id) throw strapi.errors.badRequest('This collection does not have a user id');

    if(userId === singleCollection.user.id){
      return true;
    }

    return false;
  } catch(err) {
    throw new Error(err);
  }
};

module.exports = isOwner;