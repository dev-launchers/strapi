const isOwner = async (collection, userId, id) => {
    try {
        const singleCollection = await collection.findOne({ id });

        if(userId === singleCollection.user.id){
            console.log('YOU HAVE ACESS');
            return true;
        }

        return false;
    } catch(err) {
        console.error(err);
    }
}

module.exports = isOwner;