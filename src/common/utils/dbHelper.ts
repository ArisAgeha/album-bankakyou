import { db } from '../nedb';

export async function upsertMany(querysObject: any[], updateObjs: any) {
    const exsistsObject: any[] = (await db.directory.find({ $or: querysObject }).exec());
    const ninObject = querysObject.filter(obj =>
        !exsistsObject.some((eObj) =>
            Object.keys(obj).every(key => eObj[key] === obj[key])
        ));
        console.log(ninObject);
    await db.directory.insert(ninObject);
    await db.directory.update({ $or: querysObject }, { $set: updateObjs }, { multi: true });
}