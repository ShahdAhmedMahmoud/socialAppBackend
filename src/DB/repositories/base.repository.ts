import  { Model, Types, type PopulateOptions, type ProjectionType, type QueryFilter, type QueryOptions, type UpdateQuery } from "mongoose";
import { type HydratedDocument } from "mongoose";




abstract class BaseRepository<TDocument> {

    constructor(protected readonly model: Model<TDocument>) {}

    async create(data: Partial<TDocument>): Promise<HydratedDocument<TDocument>> {
        return this.model.create(data);
    }
    async findById(id: Types.ObjectId): Promise<HydratedDocument<TDocument> | null> {
        return this.model.findById(id);
    }
    async findOne({
        filter,
        projection,
    }: {
        filter: QueryFilter<TDocument>;
        projection?: ProjectionType<TDocument>;
    }): Promise<HydratedDocument<TDocument> | null> {
        return this.model.findOne(filter, projection);  

    }
    async find({
        filter,
        projection,
        options
    }: {
        filter: QueryFilter<TDocument>;
        projection?: ProjectionType<TDocument>;
        options?: QueryOptions; // You can specify the exact type for options if needed
    }): Promise<HydratedDocument<TDocument>[]> {
        return this.model.find(filter, projection)
          .sort(options?.sort)
          .skip(options?.skip!)
          .limit(options?.limit!)
          .populate(options?.populate as PopulateOptions);
    }
    findByIdAndUpdate(
        {id, update, 
            options
        }: { 
            id: Types.ObjectId;
             update: UpdateQuery<TDocument>;
              options?: QueryOptions }):
               Promise<HydratedDocument<TDocument> | null> {
        return this.model.findByIdAndUpdate(id, update, { new: true, ...options });
    }
    findOneAndUpdate(
        { filter, update, options }:
         { filter: QueryFilter<TDocument>; 
            update: UpdateQuery<TDocument>;
             options?: QueryOptions<TDocument> }
    ): Promise<HydratedDocument<TDocument> | null> {
        return this.model.findOneAndUpdate(filter, update, { new: true, ...options });
    }
    findOneAndDelete({
        filter,
        options
    }: {
        filter: QueryFilter<TDocument>;
        options?: QueryOptions<TDocument>;
    }): Promise<HydratedDocument<TDocument> | null> {
        return this.model.findOneAndDelete(filter, options);
    }
    
}
export default BaseRepository;