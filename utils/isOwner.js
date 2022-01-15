const isOwner = async (collection, userId, id) => {
  try {
    const singleCollection = await collection.findOne({ id });

    if(!singleCollection) throw new Error('A record with that id was not found');

    if(!singleCollection.user?.id) throw new Error('This collection does not have a user id');

    if(userId === singleCollection.user.id){
      return true;
    }

    return false;
  } catch(err) {
    console.error(err);
    return false;
  }
};

module.exports = isOwner;