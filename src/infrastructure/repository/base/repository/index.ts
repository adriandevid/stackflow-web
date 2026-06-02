import { Database } from 'better-sqlite3';

export default class Respository {
    executeOperation(operation: () => Database) {
        try {
            operation();
            return true;
        } catch (ex) {
            console.log(ex);
            return false;
        }
    }
}