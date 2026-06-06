export interface PincodeResponse {
  Message: string;
  Status: "Success" | "Error";
  PostOffice:
    | {
        Name: string;
        Description: string | null;
        BranchType: string;
        DeliveryStatus: string;
        Circle: string;
        District: string;
        Division: string;
        Region: string;
        Block: string;
        State: string;
        Country: string;
        Pincode: string;
      }[]
    | null;
}

export async function fetchLocationFromPincode(
  pincode: string,
): Promise<{ state: string; district: string } | null> {
  if (pincode.length !== 6) return null;

  try {
    const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
    const data: PincodeResponse[] = await response.json();

    if (
      data &&
      data[0] &&
      data[0].Status === "Success" &&
      data[0].PostOffice &&
      data[0].PostOffice.length > 0
    ) {
      const postOffice = data[0].PostOffice[0];
      return {
        state: postOffice.State,
        district: postOffice.District,
      };
    }
    return null;
  } catch (error) {
    console.error("Failed to fetch location from pincode:", error);
    return null;
  }
}
