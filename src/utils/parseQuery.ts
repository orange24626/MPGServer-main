import { lowerCase } from "lodash";
import { ParsedQs } from "qs";
import moment from "moment";

export function parseQuery(query: ParsedQs, fieldEnum: any, searchFields?: string[]) {
  const { filter = "{}", range = "[0,9]", sort = '["createdAt", "DESC"]' } = query;
  let filterObj = JSON.parse(filter as string);
  if (filterObj.id) {
    filterObj = {
      ...filterObj,
      id: {
        in: filterObj.id.map((id: string) => (id.length > 20 ? BigInt(id) : +id)),
      },
    };
  }
  if (filterObj.createdAt?.lte && moment(filterObj.createdAt?.lte).isValid()) {
    filterObj.createdAt.lte = moment(filterObj.createdAt.lte).toDate();
  }

  if (filterObj.createdAt?.lt && moment(filterObj.createdAt?.lt).isValid()) {
    filterObj.createdAt.lt = moment(filterObj.createdAt.lt).toDate();
  }
  if (filterObj.createdAt?.gte && moment(filterObj.createdAt?.gte).isValid()) {
    filterObj.createdAt.gte = moment(filterObj.createdAt.gte).toDate();
  }

  if (filterObj.createdAt?.gt && moment(filterObj.createdAt?.gt).isValid()) {
    filterObj.createdAt.gt = moment(filterObj.createdAt.gt).toDate();
  }

  if (filterObj.createdAt?.rangeStr === "today") {
    filterObj.createdAt.gte = moment().startOf("day").toDate();
    filterObj.createdAt.lte = new Date();
  }
  if (filterObj.createdAt?.rangeStr === "7days") {
    filterObj.createdAt.gte = moment().subtract(7, "days").toDate();
    filterObj.createdAt.lte = new Date();
  }
  if (filterObj.createdAt?.rangeStr) {
    delete filterObj.createdAt.rangeStr;
  }
  let search = filterObj.q;

  delete filterObj.q;
  if (search && searchFields) {
    filterObj = {
      AND: [
        { ...filterObj },
        {
          OR: searchFields.map((field) => ({
            [field]: {
              contains: search,
            },
          })),
        },
      ],
    };
  }

  const rangeObj = JSON.parse(range as string);
  const sortObj = JSON.parse(sort as string);

  if (!Object.keys(fieldEnum).includes(sortObj[0])) {
    sortObj[0] = "createdAt";
  }
  sortObj[1] = lowerCase(sortObj[1]) || "desc";
  let take = (rangeObj[1] || 25) - (rangeObj[0] || 0) + 1;
  if (filterObj.id) {
    take = filterObj.id.length;
  }
  return {
    condition: filterObj,
    skip: rangeObj[0] || 0,
    take,
    orderBy: {
      [sortObj[0]]: sortObj[1],
    },
  };
}
